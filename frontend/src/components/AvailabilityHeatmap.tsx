import { useMemo, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Calendar, Star, Clock, Pencil, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CommunicationProfile } from '@/types/event';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format } from 'date-fns';

interface EventDateTime {
  date: string;
  time: string;
}

interface AvailabilityHeatmapProps {
  guests: CommunicationProfile[];
  suggestedTime?: { day: string; slot: string } | null;
  eventDateTime?: EventDateTime;
  onEventDateTimeChange?: (dateTime: EventDateTime) => void;
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const TIME_SLOTS = [
  '9am', '10am', '11am', '12pm', '1pm', '2pm', '3pm', '4pm', '5pm', '6pm', '7pm', '8pm', '9pm'
];

// Your pre-set availability (as a college student - evenings and weekends)
const USER_AVAILABILITY: Record<string, boolean[]> = {
  Mon: [false, false, false, false, false, false, true, true, true, true, true, true, true],
  Tue: [false, false, false, false, false, false, true, true, true, true, true, true, true],
  Wed: [false, false, false, false, false, false, true, true, true, true, true, true, true],
  Thu: [false, false, false, false, false, false, true, true, true, true, true, true, true],
  Fri: [false, false, false, false, false, true, true, true, true, true, true, true, true],
  Sat: [true, true, true, true, true, true, true, true, true, true, true, true, true],
  Sun: [true, true, true, true, true, true, true, true, true, true, false, false, false],
};

// Generate mock availability for guests
function generateGuestAvailability(guestId: string): Record<string, boolean[]> {
  const availability: Record<string, boolean[]> = {};
  const seed = guestId.charCodeAt(0) + guestId.charCodeAt(guestId.length - 1);
  
  DAYS.forEach((day, dayIndex) => {
    availability[day] = TIME_SLOTS.map((_, slotIndex) => {
      const hash = (seed * (dayIndex + 1) * (slotIndex + 1)) % 100;
      const bonus = (slotIndex >= 8 ? 20 : 0) + (dayIndex >= 5 ? 15 : 0);
      return hash + bonus > 50;
    });
  });
  
  return availability;
}

export function getBestTimeSlot(guests: CommunicationProfile[]): { day: string; slot: string; count: number } | null {
  if (guests.length === 0) return null;
  
  let bestSlot: { day: string; slotIndex: number; count: number } | null = null;
  
  DAYS.forEach(day => {
    TIME_SLOTS.forEach((_, slotIndex) => {
      let count = USER_AVAILABILITY[day]?.[slotIndex] ? 1 : 0;
      
      guests.forEach(guest => {
        const guestAvail = generateGuestAvailability(guest.userId);
        if (guestAvail[day]?.[slotIndex]) count++;
      });
      
      if (!bestSlot || count > bestSlot.count) {
        bestSlot = { day, slotIndex, count };
      }
    });
  });
  
  return bestSlot ? { day: bestSlot.day, slot: TIME_SLOTS[bestSlot.slotIndex], count: bestSlot.count } : null;
}

export default function AvailabilityHeatmap({ guests, suggestedTime, eventDateTime, onEventDateTimeChange }: AvailabilityHeatmapProps) {
  const [isEditingDateTime, setIsEditingDateTime] = useState(false);
  const [editDate, setEditDate] = useState<Date | undefined>(
    eventDateTime?.date ? new Date(eventDateTime.date) : undefined
  );
  const [editTime, setEditTime] = useState(eventDateTime?.time || '19:00');
  const [calendarOpen, setCalendarOpen] = useState(false);

  // Sync with external eventDateTime prop
  useEffect(() => {
    if (eventDateTime?.date) {
      setEditDate(new Date(eventDateTime.date));
    }
    if (eventDateTime?.time) {
      setEditTime(eventDateTime.time);
    }
  }, [eventDateTime]);

  const handleSaveDateTime = () => {
    if (editDate && onEventDateTimeChange) {
      onEventDateTimeChange({
        date: format(editDate, 'yyyy-MM-dd'),
        time: editTime
      });
    }
    setIsEditingDateTime(false);
  };
  const { heatmapData, bestSlots } = useMemo(() => {
    const data: Record<string, number[]> = {};
    
    DAYS.forEach(day => {
      data[day] = new Array(TIME_SLOTS.length).fill(0);
    });
    
    // Add user availability
    DAYS.forEach(day => {
      TIME_SLOTS.forEach((_, slotIndex) => {
        if (USER_AVAILABILITY[day]?.[slotIndex]) {
          data[day][slotIndex]++;
        }
      });
    });
    
    // Add guest availability
    guests.forEach(guest => {
      const guestAvail = generateGuestAvailability(guest.userId);
      DAYS.forEach(day => {
        TIME_SLOTS.forEach((_, slotIndex) => {
          if (guestAvail[day]?.[slotIndex]) {
            data[day][slotIndex]++;
          }
        });
      });
    });
    
    // Find best slots
    const slots: { day: string; slotIndex: number; count: number }[] = [];
    DAYS.forEach(day => {
      TIME_SLOTS.forEach((_, slotIndex) => {
        slots.push({ day, slotIndex, count: data[day][slotIndex] });
      });
    });
    
    const best = slots
      .filter(s => s.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);
    
    return { heatmapData: data, bestSlots: best };
  }, [guests]);

  const totalPeople = guests.length + 1;

  const getHeatColor = (count: number) => {
    if (count === 0) return 'bg-muted/30';
    const percentage = count / totalPeople;
    if (percentage >= 0.9) return 'bg-green-500';
    if (percentage >= 0.7) return 'bg-green-400';
    if (percentage >= 0.5) return 'bg-yellow-400';
    if (percentage >= 0.3) return 'bg-orange-400';
    return 'bg-orange-300';
  };

  if (guests.length === 0) {
    return (
      <div className="rounded-xl border bg-card p-6 text-center">
        <Calendar className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">
          Select guests to see group availability
        </p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border bg-card p-4"
    >
      {/* Event Date/Time Editor */}
      {eventDateTime && (
        <div className="mb-4 p-3 bg-secondary/50 rounded border border-border">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">Event Date & Time</span>
            </div>
            {!isEditingDateTime ? (
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-7 px-2"
                onClick={() => setIsEditingDateTime(true)}
              >
                <Pencil className="w-3 h-3 mr-1" />
                Edit
              </Button>
            ) : (
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-7 px-2 text-green-600"
                onClick={handleSaveDateTime}
              >
                <Check className="w-3 h-3 mr-1" />
                Save
              </Button>
            )}
          </div>
          
          {!isEditingDateTime ? (
            <div className="text-sm text-muted-foreground">
              {editDate ? format(editDate, 'EEEE, MMMM d, yyyy') : 'No date set'} at {editTime}
            </div>
          ) : (
            <div className="flex gap-3 items-end">
              <div className="flex-1">
                <Label className="text-xs mb-1 block">Date</Label>
                <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className={cn(
                        "w-full justify-start text-left font-normal h-9 rounded-md",
                        !editDate && "text-muted-foreground"
                      )}
                    >
                      <Calendar className="w-3 h-3 mr-2" />
                      {editDate ? format(editDate, 'MMM d, yyyy') : 'Pick date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 rounded" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={editDate}
                      onSelect={(date) => {
                        setEditDate(date);
                        setCalendarOpen(false);
                      }}
                      initialFocus
                      className={cn("p-3 pointer-events-auto rounded")}
                      classNames={{
                        day: "h-9 w-9 p-0 font-normal aria-selected:opacity-100 rounded",
                        day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground rounded",
                        day_today: "bg-accent text-accent-foreground rounded",
                        nav_button: "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 rounded border border-input",
                      }}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="w-24">
                <Label className="text-xs mb-1 block">Time</Label>
                <div className="relative">
                  <Clock className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
                  <Input
                    type="time"
                    value={editTime}
                    onChange={(e) => setEditTime(e.target.value)}
                    className="pl-7 h-9 text-sm rounded-md"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-foreground" />
          <h3 className="font-semibold text-sm">Group Availability</h3>
        </div>
        <span className="text-xs text-muted-foreground">
          {guests.length + 1} people
        </span>
      </div>

      {/* Suggested time highlight */}
      {suggestedTime && (
        <div className="mb-2 p-2 bg-secondary rounded-xl border border-border">
          <div className="flex items-center gap-2">
            <Star className="w-3 h-3 text-foreground" />
            <span className="text-xs font-medium">Auto-selected: {suggestedTime.day} at {suggestedTime.slot}</span>
          </div>
        </div>
      )}

      {/* Best times */}
      {bestSlots.length > 0 && !suggestedTime && (
        <div className="mb-2 p-2 bg-secondary rounded-xl border border-border">
          <div className="flex items-center gap-2 mb-1">
            <Star className="w-3 h-3 text-foreground" />
            <span className="text-xs font-medium">Best Times</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {bestSlots.map((slot, i) => (
              <div
                key={i}
                className="px-2 py-0.5 bg-primary/20 rounded text-[10px] font-medium"
              >
                {slot.day} {TIME_SLOTS[slot.slotIndex]} ({slot.count}/{totalPeople})
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Heatmap grid */}
      <div className="flex gap-1">
        {/* Time labels */}
        <div className="flex flex-col gap-0.5 pr-1">
          <div className="h-5" />
          {TIME_SLOTS.map((time) => (
            <div key={time} className="h-5 text-[10px] text-muted-foreground flex items-center justify-end pr-1">
              {time}
            </div>
          ))}
        </div>

        {/* Day columns */}
        {DAYS.map((day) => (
          <div key={day} className="flex-1 flex flex-col gap-0.5">
            <div className="h-5 text-[10px] font-medium text-center">{day}</div>
            {TIME_SLOTS.map((_, slotIndex) => {
              const count = heatmapData[day][slotIndex];
              const isBestSlot = bestSlots.some(
                s => s.day === day && s.slotIndex === slotIndex
              );
              const isSuggestedSlot = suggestedTime?.day === day && 
                TIME_SLOTS[slotIndex] === suggestedTime?.slot;
              return (
                <motion.div
                  key={slotIndex}
                  className={cn(
                    "h-5 rounded-sm relative group",
                    getHeatColor(count),
                    isBestSlot && !isSuggestedSlot && "ring-2 ring-primary ring-offset-1 ring-offset-background",
                    isSuggestedSlot && "ring-2 ring-green-500 ring-offset-1 ring-offset-background"
                  )}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: (DAYS.indexOf(day) * TIME_SLOTS.length + slotIndex) * 0.005 }}
                >
                  {/* Tooltip */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-popover text-popover-foreground text-[10px] rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                    {count}/{totalPeople} available
                  </div>
                </motion.div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mt-4">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-sm bg-muted/30" />
          <span className="text-[10px] text-muted-foreground">None</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-sm bg-orange-300" />
          <span className="text-[10px] text-muted-foreground">Few</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-sm bg-yellow-400" />
          <span className="text-[10px] text-muted-foreground">Half</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-sm bg-green-500" />
          <span className="text-[10px] text-muted-foreground">All</span>
        </div>
      </div>
    </motion.div>
  );
}
