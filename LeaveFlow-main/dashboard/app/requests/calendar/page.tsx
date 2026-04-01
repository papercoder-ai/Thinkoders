"use client";

import { useQuery } from "@tanstack/react-query";
import { api, LeaveRequest, Holiday } from "../../lib/api";
import { useAuth } from "../../lib/auth-context";
import { useRouter } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  getDay,
  parseISO,
  isWithinInterval,
} from "date-fns";

export default function CalendarPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/');
    }
  }, [authLoading, isAuthenticated, router]);

  const year = currentMonth.getFullYear();

  const { data: leaves, isLoading: leavesLoading } = useQuery({
    queryKey: ['leave-history-calendar', year],
    queryFn: () => api.getLeaveHistory('approved'),
    enabled: isAuthenticated,
  });

  const { data: holidays, isLoading: holidaysLoading } = useQuery({
    queryKey: ['holidays', year],
    queryFn: () => api.getHolidays(year),
    enabled: isAuthenticated,
  });

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Calculate padding for start of month (Sunday = 0)
  const startPadding = getDay(monthStart);

  const getLeavesForDay = useMemo(() => {
    return (day: Date): LeaveRequest[] => {
      if (!leaves) return [];
      return leaves.filter((leave) => {
        const start = parseISO(leave.start_date);
        const end = parseISO(leave.end_date);
        return isWithinInterval(day, { start, end }) || isSameDay(day, start) || isSameDay(day, end);
      });
    };
  }, [leaves]);

  const getHolidayForDay = useMemo(() => {
    return (day: Date): Holiday | undefined => {
      if (!holidays) return undefined;
      const dateStr = format(day, 'yyyy-MM-dd');
      return holidays.find(h => h.date === dateStr);
    };
  }, [holidays]);

  if (authLoading || leavesLoading || holidaysLoading) {
    return (
      <main className="flex items-center justify-center py-20">
        <div className="text-muted-foreground">Loading...</div>
      </main>
    );
  }

  return (
    <main className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Leave Calendar</h1>
          <p className="text-sm text-muted-foreground mt-1">View team availability and plan coverage</p>
        </div>
        <div className="flex gap-3">
          <Link href="/requests/history" className="btn btn-ghost border text-sm">
            📊 History
          </Link>
          <Link href="/requests" className="btn btn-primary text-sm shadow-md hover:shadow-lg transition-all">
            📋 Pending
          </Link>
        </div>
      </div>

      <div className="card shadow-xl">
        {/* Month Navigation */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            className="btn bg-muted hover:bg-muted/80 border shadow-sm transition-all"
          >
            ← Prev
          </button>
          <h2 className="text-2xl font-bold">
            {format(currentMonth, 'MMMM yyyy')}
          </h2>
          <button
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            className="btn bg-muted hover:bg-muted/80 border shadow-sm transition-all"
          >
            Next →
          </button>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-2">
          {/* Day Headers */}
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day} className="text-center text-sm font-bold py-3 bg-muted rounded-t">
              {day}
            </div>
          ))}

          {/* Empty cells for start padding */}
          {Array.from({ length: startPadding }).map((_, i) => (
            <div key={`pad-${i}`} className="min-h-[100px] bg-muted/30 rounded border" />
          ))}

          {/* Days */}
          {days.map((day) => {
            const dayLeaves = getLeavesForDay(day);
            const holiday = getHolidayForDay(day);
            const isWeekend = getDay(day) === 0 || getDay(day) === 6;
            const isToday = isSameDay(day, new Date());

            return (
              <div
                key={day.toISOString()}
                className={`min-h-[100px] p-2 rounded border-2 transition-all ${
                  isToday
                    ? 'border-primary bg-primary/10 shadow-md'
                    : isWeekend
                    ? 'bg-muted/30 border-muted'
                    : holiday
                    ? 'bg-amber-500/10 border-amber-500/30'
                    : 'bg-card border hover:border-primary/50 hover:shadow-sm'
                }`}
              >
                <div className={`text-sm font-bold mb-2 ${
                  isToday ? 'text-primary text-base' : isWeekend ? 'text-muted-foreground' : ''
                }`}>
                  {format(day, 'd')}
                </div>

                {holiday && (
                  <div className="text-xs bg-amber-500/20 text-amber-700 dark:text-amber-400 px-1 rounded truncate mb-1" title={holiday.name}>
                    🎉 {holiday.name}
                  </div>
                )}

                {dayLeaves.slice(0, 2).map((leave) => (
                  <Link
                    key={leave.id}
                    href={`/requests/${leave.id}`}
                    className={`block text-xs px-1 rounded truncate mb-0.5 hover:opacity-80 ${
                      leave.leave_type === 'sick'
                        ? 'bg-red-100 text-red-800'
                        : leave.leave_type === 'casual'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-purple-100 text-purple-800'
                    }`}
                    title={`${leave.user?.name} - ${leave.leave_type}`}
                  >
                    {leave.user?.name?.split(' ')[0] || 'User'}
                  </Link>
                ))}

                {dayLeaves.length > 2 && (
                  <div className="text-xs text-muted-foreground">+{dayLeaves.length - 2} more</div>
                )}
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="mt-8 p-4 bg-muted/50 rounded-lg border">
          <p className="text-xs font-semibold text-muted-foreground uppercase mb-3">Legend</p>
          <div className="flex flex-wrap gap-6 text-sm">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded bg-green-500/20 border-2 border-green-500/40"></span>
              <span className="font-medium">Casual Leave</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded bg-red-500/20 border-2 border-red-500/40"></span>
              <span className="font-medium">Sick Leave</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded bg-purple-500/20 border-2 border-purple-500/40"></span>
              <span className="font-medium">Special Leave</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded bg-amber-500/20 border-2 border-amber-500/40"></span>
              <span className="font-medium">Holiday</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded border-2 border-primary bg-primary/10"></span>
              <span className="font-medium">Today</span>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
