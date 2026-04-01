"""
AI Service for Natural Language Processing

Uses OpenRouter with FREE models (Llama, Mistral, etc.)
"""

from openai import OpenAI
from typing import Optional, Dict, Any
from datetime import datetime
from app.config import get_settings
import json

settings = get_settings()


class AIService:
    """Service for natural language processing with OpenRouter (free models)."""
    
    def __init__(self):
        if settings.openrouter_api_key:
            self.client = OpenAI(
                base_url="https://openrouter.ai/api/v1",
                api_key=settings.openrouter_api_key
            )
            # Use Llama 2 70B (much more intelligent than Mistral 7B)
            self.model = "meta-llama/llama-2-70b-chat:free"
            print(f"[AI] [OK] Initialized with OpenRouter ({self.model})")
        else:
            self.client = None
            print("[AI] [WARN] No OpenRouter API key - using fallback mode")
            print("[AI] Get FREE key at: https://openrouter.ai/keys")
    
    async def parse_leave_request(self, user_message: str, user_name: str, conversation_history: list = None) -> Dict[str, Any]:
        """Parse natural language leave request into structured data with conversation context."""
        if not self.client:
            return {"error": "AI service not configured. Get free API key at https://openrouter.ai/keys"}
        
        today = datetime.now().strftime("%Y-%m-%d")
        
        # Build conversation context
        context_text = ""
        if conversation_history and len(conversation_history) > 0:
            context_text = "\n\nRecent conversation:\n"
            for msg in conversation_history[-10:]:  # Last 10 messages
                sender = "User" if msg.get('is_from_user') else "Assistant"
                context_text += f"{sender}: {msg.get('message')}\n"
        
        prompt = f"""You are a professional and friendly HR assistant helping {user_name} with their leave request. 
Analyze their message carefully and extract leave details with high accuracy.

Today's date: {today}
Day of week: {datetime.now().strftime("%A")}
{context_text}

Current message: "{user_message}"

Parse the message and extract:
1. **start_date** (YYYY-MM-DD format):
   - If "tomorrow": calculate from today ({today})
   - If "next Monday/Tuesday/etc": calculate actual date
   - If "15th" or "Dec 15": use current/next month intelligently
   - If "from 20-22": start is 20th
   
2. **end_date** (YYYY-MM-DD format):
   - If single day mentioned, same as start_date
   - If "2 days", calculate end_date from start_date
   - If "from 20-22": end is 22nd
   - If "for 3 days": calculate end_date as start_date + 2
   
3. **leave_type**: Choose most appropriate:
   - "casual": general leave, personal work, vacation, family function
   - "sick": medical, health issues, doctor appointment, not feeling well
   - "special": emergency, bereavement, urgent family matter
   
4. **reason**: Extract in user's own words, keep natural and complete
   
5. **duration_type**:
   - "full": full day(s)
   - "half_morning": morning half day (first half)
   - "half_afternoon": afternoon half day (second half)
   
6. **is_half_day**: true if half day mentioned, else false

7. **half_day_period**: "morning" or "afternoon" if half day

Be intelligent about:
- Relative dates (tomorrow, next week, day after tomorrow)
- Casual language ("need off", "won't be in", "taking leave")
- Implicit information from conversation history
- Ambiguous dates (use context to resolve)

Respond ONLY with valid JSON (no markdown, no extra text):
{{
  "start_date": "YYYY-MM-DD",
  "end_date": "YYYY-MM-DD",
  "leave_type": "casual",
  "reason": "complete reason from user",
  "duration_type": "full",
  "is_half_day": false,
  "half_day_period": null
}}

If information is missing or ambiguous, respond:
{{"error": "polite, specific question about what's unclear (e.g., 'Which dates do you need leave for?')"}}"""

        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.2,  # Lower for more accurate extraction
                max_tokens=400,
                timeout=15.0
            )
            
            text = response.choices[0].message.content.strip()
            
            # Handle empty response
            if not text or text.isspace():
                print("[AI] Empty response from API")
                return {"error": "Could you be more specific about your leave dates and reason?"}
            
            # Remove HTML tags (like <s>, <div>, etc.)
            import re
            text = re.sub(r'<[^>]+>', '', text)
            text = text.strip()
            
            # Extract JSON from markdown code blocks if present
            if "```json" in text:
                text = text.split("```json")[1].split("```")[0].strip()
            elif "```" in text:
                text = text.split("```")[1].split("```")[0].strip()
            
            # Remove any remaining markdown
            text = text.strip().strip('`').strip()
            
            if not text:
                print("[AI] No valid JSON after cleanup")
                return {"error": "Could you be more specific about your leave dates and reason?"}
            
            result = json.loads(text)
            
            # Validate the result
            if "error" not in result:
                required_fields = ["start_date", "end_date", "leave_type"]
                missing = [f for f in required_fields if f not in result or not result[f]]
                if missing:
                    return {"error": f"I need more details: {', '.join(missing)}. Can you clarify?"}
            
            return result
        
        except json.JSONDecodeError as e:
            print(f"[AI] JSON parse error: {e}")
            print(f"[AI] Raw response: {text[:200] if 'text' in locals() else 'N/A'}")
            return {"error": "Could you rephrase your leave request? For example: 'I need leave from Dec 15-17' or 'Tomorrow off for personal reasons'"}
        except Exception as e:
            error_msg = str(e)
            print(f"[AI] Error parsing: {error_msg}")
            
            # Check if it's an auth error
            if "401" in error_msg or "authentication" in error_msg.lower():
                print("[AI] ❌ Invalid API key - get one at https://openrouter.ai/keys")
                return {"error": "AI service authentication failed"}
            elif "429" in error_msg or "rate" in error_msg.lower():
                print("[AI] ⚠️ Rate limit - please try again in a moment")
                return {"error": "Too many requests, please wait a moment"}
            
            return {"error": "Could you please provide the leave dates and reason?"}
    
    async def generate_natural_response(
        self, 
        action: str, 
        details: Dict[str, Any], 
        user_name: str = "there",
        conversation_history: list = None
    ) -> str:
        """Generate natural, conversational responses using LLM with conversation context.
        
        Args:
            action: Type of action (leave_submitted, balance_info, etc.)
            details: Dict with relevant details for the action
            user_name: Name of the user
            conversation_history: Previous conversation context
        """
        if not self.client:
            return self._fallback_response(action, details)
        
        # Build conversation context
        context_text = ""
        if conversation_history and len(conversation_history) > 0:
            context_text = "\n\nRecent conversation context:\n"
            for msg in conversation_history[-5:]:  # Last 5 messages
                sender = "User" if msg.get('is_from_user') else "Assistant"
                context_text += f"{sender}: {msg.get('message')}\n"
        
        # Create a natural language prompt based on the action
        if action == "leave_submitted":
            prompt = f"""You are a professional and friendly WhatsApp assistant for LeaveFlow.
{user_name} just submitted a leave request. Write a warm confirmation message.
{context_text}

Request: #{details.get('id')} | {details.get('start_date')} to {details.get('end_date')} | {details.get('days')} days | {details.get('type', 'casual')}

Message must:
- Confirm with enthusiasm  
- Include request ID and dates
- Mention manager will review
- Use 1-2 emojis max (✅ 📅)
- Be 3-4 lines max
- Sound natural, not robotic

Generate ONLY the message:"""

        elif action == "balance_info":
            prompt = f"""You are a helpful WhatsApp assistant. {user_name} checked their leave balance.
Present it clearly and professionally.
{context_text}

Balance:
- Casual: {details.get('casual')} days
- Sick: {details.get('sick')} days  
- Special: {details.get('special')} days

Make it clear, positive, helpful. Use emojis (🏖️ 🏥 ⭐).

Generate ONLY the message:"""

        elif action == "error":
            prompt = f"""You are a friendly WhatsApp assistant. Something went wrong.
Write a brief, helpful error message for {user_name}.
{context_text}

Error: {details.get('message', 'Something went wrong')}

Be apologetic, helpful, and encourage them to try again.
Use 1 emoji. Keep to 2 lines.

Generate ONLY the message:"""

        else:
            prompt = f"""You are a friendly WhatsApp assistant for LeaveFlow.
Generate a natural response for {user_name}.
{context_text}

Context: {action}
Details: {str(details)[:200]}

Be friendly, helpful, professional. Keep it concise (under 100 words).

Generate ONLY the message:"""

        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.7,  # Balanced creativity
                max_tokens=150,
                timeout=10.0  # 10 second timeout to prevent slow responses
            )
            
            msg = response.choices[0].message.content.strip()
            
            # Remove HTML tags (like <s>, <div>, etc.)
            import re
            msg = re.sub(r'<[^>]+>', '', msg)
            
            # Clean markdown
            msg = msg.replace("```", "").replace("**", "").strip()
            
            if msg.startswith('"') and msg.endswith('"'):
                msg = msg[1:-1]
            
            return msg or self._fallback_response(action, details)
            
        except Exception as e:
            print(f"[AI] Error generating response: {e}")
            return self._fallback_response(action, details)
    
    def _fallback_response(self, action: str, details: Dict[str, Any]) -> str:
        """Fallback responses if AI is unavailable."""
        if action == "leave_submitted":
            return f"""✅ Got it! Your leave request is in.

📋 Request #{details.get('id')} for {details.get('start_date')} to {details.get('end_date')}
🏷️ {details.get('type', '').capitalize()} - {details.get('days')} days

Your manager will review it shortly. I'll let you know once they respond! 👍"""
        elif action == "leave_approved":
            return f"🎉 Great news! Your leave request #{details.get('id')} has been approved. Enjoy your time off!"
        elif action == "leave_rejected":
            return f"Hey, your leave request #{details.get('id')} wasn't approved. Reason: {details.get('reason', 'Not specified')}. Feel free to discuss with your manager."
        elif action == "balance_check":
            return f"""📊 Your Leave Balance

🏖️ Casual: {details.get('casual')} days
🏥 Sick: {details.get('sick')} days
⭐ Special: {details.get('special')} days

Ready to apply for leave?"""
        elif action == "balance_updated":
            return f"📍 Balance updated: {details.get('days')} {details.get('type')} days deducted. Your new balance is {details.get('new_balance')} days."
        else:
            return "✅ All done!"
    
    async def classify_message_intent(self, user_message: str, conversation_history: list = None) -> Dict[str, Any]:
        """Classify if a message is related to leave management."""
        if not self.client:
            # Fallback: check for leave keywords
            leave_keywords = [
                "leave", "vacation", "holiday", "off", "absent", "sick", "casual", "annual",
                "balance", "status", "pending", "approve", "reject", "cancel", "request",
                "days", "date", "tomorrow", "today", "week", "month", "monday", "tuesday",
                "wednesday", "thursday", "friday", "saturday", "sunday", "morning", "afternoon",
                "half", "full", "team", "manager", "hr", "supervisor"
            ]
            message_lower = user_message.lower()
            is_related = any(keyword in message_lower for keyword in leave_keywords)
            return {"is_leave_related": is_related}
        
        # Build conversation context
        context_text = ""
        if conversation_history and len(conversation_history) > 0:
            context_text = "\n\nRecent conversation:\n"
            for msg in conversation_history[-5:]:  # Last 5 messages for context
                sender = "User" if msg.get('is_from_user') else "Assistant"
                context_text += f"{sender}: {msg.get('message')}\n"
        
        prompt = f"""You are an HR assistant chatbot. Analyze this user message and determine if it's related to leave management, vacation, or time-off requests.

Message: "{user_message}"{context_text}

Respond with ONLY a JSON object in this exact format:
{{"is_leave_related": true}} or {{"is_leave_related": false}}

Consider these as leave-related:
- Leave requests, applications, approvals
- Balance inquiries, status checks
- Cancellation, modification of requests
- Team leave information
- HR/Manager leave-related tasks

Consider these as NOT leave-related:
- Weather, news, sports
- Personal questions
- Jokes, random conversation
- Technical issues unrelated to leave
- General greetings (unless asking about leave)

Be strict: only classify as leave-related if there's clear intent about leave management."""
        
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.1,  # Low temperature for consistent classification
                max_tokens=50,
                timeout=10.0
            )
            
            text = response.choices[0].message.content.strip()
            
            # Extract JSON
            if "```json" in text:
                text = text.split("```json")[1].split("```")[0].strip()
            elif "```" in text:
                text = text.split("```")[1].split("```")[0].strip()
            
            result = json.loads(text)
            return result
            
        except Exception as e:
            print(f"[AI] Error classifying message intent: {e}")
            # Fallback to keyword check
            leave_keywords = [
                "leave", "vacation", "holiday", "off", "absent", "sick", "casual", "annual",
                "balance", "status", "pending", "approve", "reject", "cancel", "request"
            ]
            message_lower = user_message.lower()
            is_related = any(keyword in message_lower for keyword in leave_keywords)
            return {"is_leave_related": is_related}
    
    def _fallback_greeting(self, user_message: str) -> str:
        """Fallback greeting if AI is unavailable."""
        message_lower = user_message.lower().strip()
        
        if any(word in message_lower for word in ["hi", "hello", "hey", "hola"]):
            return "Hey there! 👋 How can I help you with your leaves today?"
        elif any(word in message_lower for word in ["thank", "tq", "ty", "thx"]):
            return "You're welcome! 😊 Anything else I can help with?"
        elif any(word in message_lower for word in ["bye", "goodbye", "cya"]):
            return "Goodbye! 👋 Talk soon!"
        elif any(word in message_lower for word in ["help", "how"]):
            return "I can help you apply for leaves, check your balance, and manage requests. Just ask naturally! 📋"
        else:
            return "Hey! 😊 How can I assist you today?"


# Global instance
ai_service = AIService()

# Backward compatibility alias
gemini_service = ai_service
