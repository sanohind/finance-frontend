import React from 'react';
import { Calendar as BigCalendar, momentLocalizer, Views } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import Swal from 'sweetalert2';
import { useNavigate } from 'react-router-dom';

const localizer = momentLocalizer(moment);

interface Event {
  title: string;
  start: Date;
  end: Date;
  type: string;
  bp_code?: string;
}

interface CalendarProps {
  events: Event[];
  defaultView?: typeof Views[keyof typeof Views];
}

const Calendar: React.FC<CalendarProps> = ({ events, defaultView = Views.MONTH }) => {
  const navigate = useNavigate();

  const onSelectEventHandler = (event: Event) => {
    Swal.fire({
      icon: 'info',
      title: event.bp_code ? `${event.title} | ${event.bp_code}` : event.title,
      html: `
      <div>
        <p>
          Start Date: <strong>${moment(event.start).format('MMMM D, YYYY')}</strong>
        </p>
        <p>
          End Date: <strong>${moment(event.end).format('MMMM D, YYYY')}</strong>
        </p>
        <p>Type: <strong>${event.type}</strong></p>
      </div>
      `,
      confirmButtonColor: '#1e3a8a',
      confirmButtonText: 'Go to Details',
      showCancelButton: true,
      cancelButtonText: 'Close',
      cancelButtonColor: '#dc2626',
    }).then((result) => {
      if (result.isConfirmed) {
        if (event.type === 'PO') {
          navigate(`/purchase-order-detail?noPO=${event.title.split(': ')[1]}`);
        } else if (event.type === 'DN') {
          navigate(`/delivery-note-detail-edit?noDN=${event.title.split(': ')[1]}`);
        } else if (event.type === 'DN History') {
          navigate(`/delivery-note-detail?noDN=${event.title.split(': ')[1]}`);
        }
      }

    });
  };

  const eventStyleGetter = (event: Event) => {
    let backgroundColor = '#039BE5'; // Default blue color like Google Calendar

    if (event.type === 'PO') {
      backgroundColor = '#1E3A8A'; // Blue-900 for Purchase Orders
    } else if (event.type === 'DN') {
      backgroundColor = '#DC2626'; 
    } else if (event.type === 'DN History') {
      backgroundColor = '#059669';
    }

    const style = {
      backgroundColor,
      borderRadius: '4px',
      color: 'white',
      border: 'none',
      fontSize: '12px',
      fontWeight: '500',
      display: 'block',
      padding: '1px 10px',
      margin: '1px 0',
      cursor: 'pointer',
    };
    return {
      style,
    };
  };

  const formats = {
    monthHeaderFormat: (date: Date) => moment(date).format('MMMM YYYY').toUpperCase(),
    dayHeaderFormat: (date: Date) => moment(date).format('dddd, MMMM D'),
    dayRangeHeaderFormat: ({ start, end }: { start: Date; end: Date }) =>
      `${moment(start).format('MMM D')} – ${moment(end).format('MMM D, YYYY')}`,
  };

  return (
    <div className="w-full max-w-full rounded-lg bg-white shadow-md">
      <BigCalendar
        localizer={localizer}
        events={events}
        defaultView={defaultView}
        views={['month', 'week', 'day']}
        startAccessor="start"
        endAccessor="end"
        style={{
          height: 900,
          padding: '30px',
        }}
        eventPropGetter={eventStyleGetter}
        onSelectEvent={onSelectEventHandler}
        toolbar={true}
        formats={formats}
        popup
        selectable
        className="custom-calendar"
      />
      <style>
        {`
          .custom-calendar .rbc-toolbar {
            padding: 1rem;
            margin-bottom: 1rem;
          }
          .custom-calendar .rbc-toolbar-label {
            font-size: 1.75rem;
            font-weight: 700;
            color: #111827;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            padding: 12px 0;
          }
          .custom-calendar .rbc-toolbar button {
            background: #ffffff;
            color: #4b5563;
            border: 1px solid #d1d5db;
            padding: 10px 16px;
            font-size: 0.9rem;
            font-weight: 500;
            border-radius: 6px;
            transition: all 0.2s ease;
            shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
          }
          .custom-calendar .rbc-toolbar button.rbc-active,
          .custom-calendar .rbc-toolbar button:focus,
          .custom-calendar .rbc-toolbar button:hover {
            background: #1e3a8a;
            color: white;
            border-color: #1e3a8a;
            shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
          }
          .custom-calendar .rbc-header {
            padding: 14px;
            font-weight: 600;
            color: #1f2937;
            background: #f9fafb;
            border-bottom: 2px solid #e5e7eb;
            text-transform: uppercase;
            font-size: 0.85rem;
            shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
          }
          .custom-calendar .rbc-month-view {
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            overflow: hidden;
          }
          .custom-calendar .rbc-event {
            padding: 4px 8px;
            font-size: 12px;
            margin: 1px 0;
          }
          .custom-calendar .rbc-month-view .rbc-day-bg {
            height: 150px;
          }
          .custom-calendar .rbc-month-view .rbc-events-container {
            height: 100%;
            overflow: hidden;
          }
          .custom-calendar .rbc-month-view .rbc-day-slot .rbc-event {
            max-height: calc(33% - 4px);
            overflow: hidden;
          }
          .custom-calendar .rbc-show-more {
            background: #f3f4f6;
            color: #374151;
            padding: 4px 8px;
            border-radius: 6px;
            font-size: 0.75rem;
            font-weight: 500;
            cursor: pointer;
            border: 1px solid #e5e7eb;
            transition: all 0.2s ease;
          }
          .custom-calendar .rbc-show-more:hover {
            background: #e5e7eb;
            color: #111827;
          }

          .custom-calendar .rbc-overlay {
      max-height: 200px;
      overflow-y: auto;
      padding: 10px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      background: white;
      width: 300px;
    }

    .custom-calendar .rbc-overlay-header {
      font-weight: 600;
      padding: 8px;
      border-bottom: 1px solid #e5e7eb;
      position: sticky;
      top: 0;
      background: white;
      z-index: 1;
    }

    .custom-calendar .rbc-overlay > .rbc-event {
      margin: 8px 0;
    }

    /* Scrollbar styling */
    .custom-calendar .rbc-overlay::-webkit-scrollbar {
      width: 6px;
    }

    .custom-calendar .rbc-overlay::-webkit-scrollbar-track {
      background: #f1f1f1;
      border-radius: 3px;
    }

    .custom-calendar .rbc-overlay::-webkit-scrollbar-thumb {
      background: #888;
      border-radius: 3px;
    }

    .custom-calendar .rbc-overlay::-webkit-scrollbar-thumb:hover {
      background: #555;
    }
        `}
      </style>
    </div>
  );
};

export default Calendar;