import React from 'react';
import { Calendar as BigCalendar, momentLocalizer, Views } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import Swal from 'sweetalert2';
import { useNavigate } from 'react-router-dom';

const localizer = momentLocalizer(moment);

interface Event {
  title: string;
  description: string;
  start_date: Date;
  end_date: Date;
  document: string;
}

interface CalendarProps {
  events: Event[];
  defaultView?: typeof Views[keyof typeof Views];
}

const CustomToolbar = (toolbar: any) => {
  return (
    <div className="rbc-toolbar">
      <div className="rbc-btn-group">
        <button type="button" onClick={() => toolbar.onNavigate('PREV')}>
          &#8592;
        </button>
        <button type="button" onClick={() => toolbar.onNavigate('TODAY')}>
          Today
        </button>
        <button type="button" onClick={() => toolbar.onNavigate('NEXT')}>
          &#8594;
        </button>
      </div>
      <span className="rbc-toolbar-label">{toolbar.label}</span>
    </div>
  );
};

const Calendar: React.FC<CalendarProps> = ({ events }) => {
  const navigate = useNavigate();

  const onSelectEventHandler = (event: Event) => {
    Swal.fire({
      icon: 'info',
      title: event.title,
      html: `
      <div>
        <p>
          Description: <strong>${event.description}</strong>
        </p>
        <p>
          Start Date: <strong>${moment(event.start_date).format('MMMM D, YYYY')}</strong>
        </p>
        <p>
          End Date: <strong>${moment(event.end_date).format('MMMM D, YYYY')}</strong>
        </p>
        <p>Document: <strong>${event.document}</strong></p>
      </div>
      `,
      confirmButtonColor: '#1e3a8a',
      confirmButtonText: 'Go to Details',
      showCancelButton: true,
      cancelButtonText: 'Close',
      cancelButtonColor: '#dc2626',
    }).then((result) => {
      if (result.isConfirmed) {
        navigate(`/document-detail?doc=${event.document}`);
      }
    });
  };

  const eventStyleGetter = () => {
    const style = {
      backgroundColor: '#1E3A8A',
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

  const mappedEvents = events.map((event) => ({
    ...event,
    start: event.start_date,
    end: event.end_date,
    allDay: true,
  }));

  return (
    <div className="w-full max-w-full rounded-lg bg-white shadow-md">
      <BigCalendar
        localizer={localizer}
        events={mappedEvents}
        defaultView={Views.MONTH}
        views={['month']}
        startAccessor="start"
        endAccessor="end"
        style={{
          height: 900,
          padding: '30px',
        }}
        eventPropGetter={eventStyleGetter}
        onSelectEvent={onSelectEventHandler}
        toolbar={true}
        components={{
          toolbar: CustomToolbar,
        }}
        formats={formats}
        popup
        selectable
        className="custom-calendar"
      />
      <style>
        {`
          .custom-calendar .rbc-toolbar {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 1rem;
            margin-bottom: 1rem;
          }
          .custom-calendar .rbc-btn-group {
            display: flex;
            justify-content: flex-start;
          }
          .custom-calendar .rbc-toolbar .rbc-toolbar-label {
            flex: 6;
            text-align: center;
            font-size: 1.75rem;
            font-weight: 700;
            color: #111827;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            padding: 12px 0;
          }
          .custom-calendar .rbc-toolbar .rbc-btn-group + .rbc-toolbar-label {
            margin-left: 0;
          }
          .custom-calendar .rbc-toolbar .rbc-btn-group:last-child {
            flex: 1;
            justify-content: flex-end;
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
            box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
          }
          .custom-calendar .rbc-toolbar button.rbc-active,
          .custom-calendar .rbc-toolbar button:focus,
          .custom-calendar .rbc-toolbar button:hover {
            background: #1e3a8a;
            color: white;
            border-color: #1e3a8a;
            box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
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