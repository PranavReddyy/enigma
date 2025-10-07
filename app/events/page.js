"use client";

import { useState, useEffect } from "react";
import {
  format,
  parseISO,
  isSameDay,
  isWithinInterval,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  addMonths,
  subMonths,
  isToday,
  isBefore,
  isAfter,
  startOfDay,
} from "date-fns";
import {
  Search,
  Calendar as CalendarIcon,
  MapPin,
  Clock,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { HeroHeader } from "@/components/header";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import PlexusBackground from "@/components/background";

const EventCard = ({ event }) => {
  const [isHovered, setIsHovered] = useState(false);

  const getEventStatus = () => {
    const today = startOfDay(new Date());
    const startDate = startOfDay(parseISO(event.start_date));
    const endDate = startOfDay(parseISO(event.end_date));

    if (isBefore(endDate, today))
      return { status: "past", color: "text-gray-400" };
    if (isAfter(startDate, today))
      return { status: "upcoming", color: "text-blue-400" };
    return { status: "ongoing", color: "text-green-400" };
  };

  const { status, color } = getEventStatus();

  return (
    <motion.div
      className="bg-white/5 border border-white/10 rounded-lg p-4 hover:bg-white/8 transition-all duration-200"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="font-medium text-white text-sm sm:text-base">
              {event.name}
            </h3>
            <span className={cn("text-xs font-medium", color)}>• {status}</span>
          </div>

          <p className="text-xs sm:text-sm text-gray-300 mb-3 line-clamp-2">
            {event.description}
          </p>

          <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs text-gray-400">
            <div className="flex items-center gap-1">
              <CalendarIcon className="w-3 h-3" />
              <span>
                {format(parseISO(event.start_date), "MMM d")}
                {event.is_multi_day &&
                  ` - ${format(parseISO(event.end_date), "MMM d")}`}
              </span>
            </div>
            {event.start_time && (
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>
                  {format(parseISO(`2000-01-01T${event.start_time}`), "h:mm a")}
                </span>
              </div>
            )}
            <div className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              <span className="truncate max-w-[100px] sm:max-w-none">
                {event.location}
              </span>
            </div>
          </div>
        </div>

        {event.registration_link && (
          <motion.a
            href={event.registration_link}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "p-2 rounded-lg bg-blue-500/20 border border-blue-500/30 transition-all duration-200 flex-shrink-0 ml-3",
              isHovered ? "opacity-100" : "opacity-60"
            )}
            whileHover={{ scale: 1.05 }}
          >
            <ExternalLink className="w-4 h-4 text-blue-400" />
          </motion.a>
        )}
      </div>
    </motion.div>
  );
};

export default function EventsPage() {
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [selectedDate, setSelectedDate] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const { data, error } = await supabase
          .from("events")
          .select("*")
          .order("start_date", { ascending: true });

        if (error) {
          console.error("Error fetching events:", error);
          return;
        }

        setEvents(data || []);
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  useEffect(() => {
    let filtered = events;
    const today = startOfDay(new Date());

    // Apply date filter first
    if (selectedDate) {
      filtered = events.filter((event) => {
        const startDate = startOfDay(parseISO(event.start_date));
        const endDate = startOfDay(parseISO(event.end_date));

        if (event.is_multi_day) {
          return isWithinInterval(selectedDate, {
            start: startDate,
            end: endDate,
          });
        } else {
          return isSameDay(selectedDate, startDate);
        }
      });
    } else {
      if (selectedFilter !== "all") {
        filtered = events.filter((event) => {
          const startDate = startOfDay(parseISO(event.start_date));
          const endDate = startOfDay(parseISO(event.end_date));

          switch (selectedFilter) {
            case "upcoming":
              return isAfter(startDate, today);
            case "past":
              return isBefore(endDate, today);
            case "ongoing":
              return startDate <= today && endDate >= today;
            default:
              return true;
          }
        });
      }
    }

    if (searchQuery) {
      filtered = filtered.filter(
        (event) =>
          event.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          event.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredEvents(filtered);
  }, [events, selectedFilter, searchQuery, selectedDate]);

  const getEventsForDate = (date) => {
    return events.filter((event) => {
      const startDate = startOfDay(parseISO(event.start_date));
      const endDate = startOfDay(parseISO(event.end_date));

      if (event.is_multi_day) {
        return isWithinInterval(date, { start: startDate, end: endDate });
      } else {
        return isSameDay(date, startDate);
      }
    });
  };

  const getDaysInMonth = () => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    return eachDayOfInterval({ start, end });
  };

  const handleFilterChange = (filter) => {
    setSelectedFilter(filter);
    setSelectedDate(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen text-white">
        <HeroHeader />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screenbg-transparent text-white">
      <HeroHeader />
      <PlexusBackground />

      <main className="pt-30 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-6 sm:mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold mb-2 bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent">
              Events & Activities
            </h1>
            <p className="text-sm sm:text-base text-gray-400">
              Discover upcoming events, workshops, and activities
            </p>
          </div>

          <div className="flex flex-col lg:grid lg:grid-cols-3 gap-6 lg:gap-8">
            <div className="order-1 lg:order-2 lg:col-span-1">
              <div className="bg-white/5 border border-white/10 rounded-lg p-4 sm:p-6 lg:sticky lg:top-24">
                <div className="flex justify-between items-center mb-4 sm:mb-6">
                  <button
                    onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                    className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                  >
                    <ChevronLeft size={18} className="text-white/70" />
                  </button>

                  <h2 className="text-base sm:text-lg font-semibold text-white">
                    {format(currentMonth, "MMMM yyyy")}
                  </h2>

                  <button
                    onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                    className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                  >
                    <ChevronRight size={18} className="text-white/70" />
                  </button>
                </div>

                <div className="grid grid-cols-7 text-center mb-3 sm:mb-4 border-b border-white/10 pb-2">
                  {["S", "M", "T", "W", "T", "F", "S"].map((day, i) => (
                    <div
                      key={i}
                      className="py-1 sm:py-2 text-xs font-medium text-white/50"
                    >
                      {day}
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-0.5 sm:gap-1">
                  {Array.from({
                    length: startOfMonth(currentMonth).getDay(),
                  }).map((_, i) => (
                    <div key={`empty-${i}`} className="aspect-square" />
                  ))}

                  {getDaysInMonth().map((date) => {
                    const isTodayDate = isToday(date);
                    const isSelected =
                      selectedDate && isSameDay(date, selectedDate);
                    const hasEvents = getEventsForDate(date).length > 0;

                    return (
                      <button
                        key={date.toString()}
                        className={cn(
                          "aspect-square flex items-center justify-center rounded-md sm:rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 relative",
                          {
                            "bg-blue-500 text-white": isSelected,
                            "border border-white/50":
                              isTodayDate && !isSelected,
                            "hover:bg-white/10": !isSelected,
                            "text-white": hasEvents && !isSelected,
                            "text-white/40": !hasEvents && !isSelected,
                          }
                        )}
                        onClick={() => setSelectedDate(date)}
                      >
                        {date.getDate()}

                        {hasEvents && !isSelected && (
                          <div className="absolute bottom-0.5 sm:bottom-1 w-1 h-1 bg-blue-400 rounded-full" />
                        )}
                      </button>
                    );
                  })}

                  {Array.from({
                    length: 6 - endOfMonth(currentMonth).getDay(),
                  }).map((_, i) => (
                    <div key={`empty-end-${i}`} className="aspect-square" />
                  ))}
                </div>
              </div>
            </div>

            <div className="order-2 lg:order-1 lg:col-span-2 space-y-4 sm:space-y-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search events..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 sm:py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition-all text-sm sm:text-base"
                />
              </div>

              <div className="flex flex-wrap gap-2">
                {["all", "upcoming", "ongoing", "past"].map((filter) => (
                  <button
                    key={filter}
                    onClick={() => handleFilterChange(filter)}
                    className={cn(
                      "px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm rounded-lg transition-all",
                      selectedFilter === filter && !selectedDate
                        ? "bg-white/10 text-white"
                        : "text-gray-400 hover:text-white hover:bg-white/5"
                    )}
                  >
                    {filter.charAt(0).toUpperCase() + filter.slice(1)}
                  </button>
                ))}
                {selectedDate && (
                  <button
                    onClick={() => setSelectedDate(null)}
                    className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-all"
                  >
                    Clear Date
                  </button>
                )}
              </div>

              <div className="space-y-3">
                {filteredEvents.length > 0 ? (
                  <>
                    <p className="text-xs sm:text-sm text-gray-400 mb-3 sm:mb-4">
                      {filteredEvents.length} event
                      {filteredEvents.length !== 1 ? "s" : ""}{" "}
                      {selectedDate
                        ? `on ${format(selectedDate, "MMMM d, yyyy")}`
                        : selectedFilter !== "all"
                        ? `(${selectedFilter})`
                        : ""}
                    </p>
                    {filteredEvents.map((event) => (
                      <EventCard key={event.id} event={event} />
                    ))}
                  </>
                ) : (
                  <div className="text-center py-8 sm:py-12">
                    <CalendarIcon className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-3 sm:mb-4" />
                    <h3 className="text-base sm:text-lg font-medium text-gray-300 mb-2">
                      No events found
                    </h3>
                    <p className="text-sm text-gray-400">
                      {searchQuery
                        ? "Try adjusting your search"
                        : "No events match your criteria"}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
