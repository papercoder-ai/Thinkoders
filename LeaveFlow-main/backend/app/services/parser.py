"""
WhatsApp Message Parser

Parses natural language leave requests into structured data.
Supports formats like:
- leave 12 Feb sick fever
- leave tomorrow casual
- leave 12 Feb to 15 Feb medical surgery
- half leave 5 Jan morning
- cancel 32
- balance
- status 32
- approve 32
- reject 32 reason here
- pending
- team today
"""

import re
from datetime import date, datetime, timedelta
from dateutil import parser as date_parser
from typing import Optional, Tuple, Dict, Any
from dataclasses import dataclass
from enum import Enum


class CommandType(Enum):
    LEAVE = "leave"
    HALF_LEAVE = "half_leave"
    CANCEL = "cancel"
    BALANCE = "balance"
    STATUS = "status"
    APPROVE = "approve"
    REJECT = "reject"
    PENDING = "pending"
    TEAM_TODAY = "team_today"
    UNKNOWN = "unknown"


@dataclass
class ParsedCommand:
    command_type: CommandType
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    leave_type: Optional[str] = None
    reason: Optional[str] = None
    request_id: Optional[int] = None
    is_half_day: bool = False
    half_day_period: Optional[str] = None  # "morning" or "afternoon"
    raw_message: str = ""
    error: Optional[str] = None


class MessageParser:
    """Parser for WhatsApp leave-related messages."""
    
    # Leave type keywords
    LEAVE_TYPES = {
        "casual": ["casual", "personal", "cl"],
        "sick": ["sick", "medical", "fever", "unwell", "ill", "health"],
        "special": ["special", "emergency", "urgent", "family"]
    }
    
    # Date keywords
    DATE_KEYWORDS = {
        "today": 0,
        "tomorrow": 1,
        "day after tomorrow": 2,
        "next week": 7,
    }
    
    def __init__(self):
        self.current_year = datetime.now().year
    
    def parse(self, message: str) -> ParsedCommand:
        """Main entry point - parse a WhatsApp message."""
        if not message:
            return ParsedCommand(command_type=CommandType.UNKNOWN, error="Empty message")
        
        message = message.strip().lower()
        raw = message
        
        # Check for simple commands first
        if message in ["balance", "bal"]:
            return ParsedCommand(command_type=CommandType.BALANCE, raw_message=raw)
        
        if message in ["pending", "list pending"]:
            return ParsedCommand(command_type=CommandType.PENDING, raw_message=raw)
        
        if message in ["team today", "who is on leave", "today leave", "today"]:
            return ParsedCommand(command_type=CommandType.TEAM_TODAY, raw_message=raw)
        
        # Check for status command
        status_match = re.match(r"status\s+(\d+)", message)
        if status_match:
            return ParsedCommand(
                command_type=CommandType.STATUS,
                request_id=int(status_match.group(1)),
                raw_message=raw
            )
        
        # Check for cancel command
        cancel_match = re.match(r"cancel\s+(\d+)", message)
        if cancel_match:
            return ParsedCommand(
                command_type=CommandType.CANCEL,
                request_id=int(cancel_match.group(1)),
                raw_message=raw
            )
        
        # Check for approve command
        approve_match = re.match(r"approve\s+(\d+)", message)
        if approve_match:
            return ParsedCommand(
                command_type=CommandType.APPROVE,
                request_id=int(approve_match.group(1)),
                raw_message=raw
            )
        
        # Check for reject command
        reject_match = re.match(r"reject\s+(\d+)\s*(.*)", message)
        if reject_match:
            return ParsedCommand(
                command_type=CommandType.REJECT,
                request_id=int(reject_match.group(1)),
                reason=reject_match.group(2).strip() or None,
                raw_message=raw
            )
        
        # Check for half leave
        if "half" in message or "half day" in message or "halfday" in message:
            return self._parse_half_leave(message, raw)
        
        # Check for leave command
        if message.startswith("leave") or "leave" in message:
            return self._parse_leave(message, raw)
        
        # Unknown command
        return ParsedCommand(command_type=CommandType.UNKNOWN, raw_message=raw, error="Could not understand message")
    
    def _parse_leave(self, message: str, raw: str) -> ParsedCommand:
        """Parse a full leave request."""
        # Remove 'leave' keyword
        message = re.sub(r"\bleave\b", "", message).strip()
        
        # Try to extract date range
        start_date, end_date, remaining = self._extract_dates(message)
        
        if not start_date:
            return ParsedCommand(
                command_type=CommandType.LEAVE,
                error="Could not parse dates. Try: leave 12 Feb to 15 Feb sick reason",
                raw_message=raw
            )
        
        # Extract leave type and reason from remaining text
        leave_type, reason = self._extract_type_and_reason(remaining)
        
        return ParsedCommand(
            command_type=CommandType.LEAVE,
            start_date=start_date,
            end_date=end_date or start_date,
            leave_type=leave_type,
            reason=reason,
            raw_message=raw
        )
    
    def _parse_half_leave(self, message: str, raw: str) -> ParsedCommand:
        """Parse a half-day leave request."""
        # Remove 'half leave' or 'half day' keywords
        message = re.sub(r"\bhalf\s*(day)?\s*(leave)?\b", "", message).strip()
        
        # Check for morning/afternoon
        period = None
        if "morning" in message:
            period = "morning"
            message = message.replace("morning", "").strip()
        elif "afternoon" in message or "evening" in message:
            period = "afternoon"
            message = re.sub(r"(afternoon|evening)", "", message).strip()
        
        # Extract date
        start_date, _, remaining = self._extract_dates(message)
        
        if not start_date:
            start_date = date.today()
        
        # Extract leave type and reason
        leave_type, reason = self._extract_type_and_reason(remaining)
        
        return ParsedCommand(
            command_type=CommandType.HALF_LEAVE,
            start_date=start_date,
            end_date=start_date,
            leave_type=leave_type,
            reason=reason,
            is_half_day=True,
            half_day_period=period or "morning",
            raw_message=raw
        )
    
    def _extract_dates(self, text: str) -> Tuple[Optional[date], Optional[date], str]:
        """Extract start and end dates from text."""
        remaining = text
        
        # Check for date keywords first
        for keyword, days_offset in self.DATE_KEYWORDS.items():
            if keyword in text:
                start = date.today() + timedelta(days=days_offset)
                remaining = text.replace(keyword, "").strip()
                return start, None, remaining
        
        # Try to match "X to Y" or "X - Y" date range
        range_pattern = r"(\d{1,2}\s*(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*(?:\s*\d{4})?)\s*(?:to|-)\s*(\d{1,2}\s*(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*(?:\s*\d{4})?)"
        range_match = re.search(range_pattern, text, re.IGNORECASE)
        
        if range_match:
            try:
                start = self._parse_date(range_match.group(1))
                end = self._parse_date(range_match.group(2))
                remaining = text[:range_match.start()] + text[range_match.end():]
                return start, end, remaining.strip()
            except:
                pass
        
        # Try to match single date
        single_pattern = r"(\d{1,2}\s*(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*(?:\s*\d{4})?)"
        single_match = re.search(single_pattern, text, re.IGNORECASE)
        
        if single_match:
            try:
                start = self._parse_date(single_match.group(1))
                remaining = text[:single_match.start()] + text[single_match.end():]
                return start, None, remaining.strip()
            except:
                pass
        
        # Try numeric date formats (12/02, 12-02-2025)
        numeric_pattern = r"(\d{1,2}[/-]\d{1,2}(?:[/-]\d{2,4})?)"
        numeric_match = re.search(numeric_pattern, text)
        
        if numeric_match:
            try:
                start = self._parse_date(numeric_match.group(1))
                remaining = text[:numeric_match.start()] + text[numeric_match.end():]
                return start, None, remaining.strip()
            except:
                pass
        
        return None, None, text
    
    def _parse_date(self, date_str: str) -> date:
        """Parse a date string into a date object."""
        parsed = date_parser.parse(date_str, dayfirst=True, fuzzy=True)
        result = parsed.date()
        
        # If no year specified and date is in the past, assume next year
        if result < date.today() and str(self.current_year) not in date_str:
            result = result.replace(year=self.current_year + 1)
        
        return result
    
    def _extract_type_and_reason(self, text: str) -> Tuple[str, Optional[str]]:
        """Extract leave type and reason from remaining text."""
        text = text.strip()
        detected_type = "casual"  # Default
        reason_parts = []
        
        words = text.split()
        type_found = False
        
        for word in words:
            word_lower = word.lower()
            
            # Check if word matches a leave type
            if not type_found:
                for ltype, keywords in self.LEAVE_TYPES.items():
                    if word_lower in keywords:
                        detected_type = ltype
                        type_found = True
                        break
                else:
                    # Word is not a type keyword, treat as reason
                    reason_parts.append(word)
            else:
                # After type is found, everything is reason
                reason_parts.append(word)
        
        reason = " ".join(reason_parts).strip() or None
        return detected_type, reason


# Singleton instance
parser = MessageParser()


def parse_message(message: str) -> ParsedCommand:
    """Convenience function to parse a message."""
    return parser.parse(message)
