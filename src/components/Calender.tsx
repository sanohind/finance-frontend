import React from 'react';
import { Calendar as BigCalendar, momentLocalizer, Views } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import Swal from 'sweetalert2';
import { AiFillFilePdf } from 'react-icons/ai'; // Import the PDF icon
import { toast, ToastContainer } from 'react-toastify'; // Import toast notifications
import 'react-toastify/dist/ReactToastify.css'; // Import toast styles
import { API_Stream_News_Admin } from '../api/api'; 
import ReactDOMServer from 'react-dom/server'; // To render React components to string

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

  const handleStreamDocumentInCalendar = async (documentPath: string) => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      toast.error('Authentication token not found.');
      return;
    }

    const filename = documentPath.includes('/') ? documentPath.substring(documentPath.lastIndexOf('/') + 1) : documentPath;

    try {
      toast.info('Fetching document...', { autoClose: 2000 });
      const response = await fetch(`${API_Stream_News_Admin()}/${filename}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        let errorText = `Failed to stream document. Status: ${response.status}`;
        try {
          const errorData = await response.json();
          if (errorData && errorData.message) {
            errorText = errorData.message;
          } else {
            const textError = await response.text();
            if (textError) errorText = textError;
          }
        } catch (e) {
          try {
            const textError = await response.text();
            if (textError) errorText = textError;
          } catch (textEx) {}
        }
        throw new Error(errorText);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const newWindow = window.open(url, '_blank');
      if (!newWindow) {
        toast.error("Failed to open document. Please check your browser's pop-up settings.");
        window.URL.revokeObjectURL(url);
      }
    } catch (error: any) {
      toast.error(error.message || 'An error occurred while trying to stream the document.');
    }
  };

  const onSelectEventHandler = (event: Event) => {
    const pdfIconHtml = ReactDOMServer.renderToStaticMarkup(
      <AiFillFilePdf className="h-5 w-5" style={{ verticalAlign: 'middle' }} />
    );

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
        <p>Document: 
          ${event.document ? `
            <button 
              id="view-calendar-doc-button" 
              title="View Document: ${event.document}"
              style="background: none; border: none; padding: 0; color: #1e3a8a; cursor: pointer; display: inline-flex; align-items: center; font-family: inherit; font-size: inherit; vertical-align: middle;"
            >
              ${pdfIconHtml}
            </button>` :
          'N/A'}
        </p>
      </div>
      `,
      showConfirmButton: false,
      showCancelButton: true,
      cancelButtonText: 'Close',
      cancelButtonColor: '#dc2626',
      didOpen: () => {
        if (event.document) {
          const docButton = document.getElementById('view-calendar-doc-button');
          if (docButton) {
            docButton.onclick = () => handleStreamDocumentInCalendar(event.document);
          }
        }
      },
    }).then((result) => {
      if (result.dismiss === Swal.DismissReason.cancel) {
        // Optional: Handle cancel button click if needed
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
    end: moment(event.end_date).add(1, 'days').toDate(),
    allDay: true,
  }));

  return (
    <>
      <ToastContainer 
        position="top-right" 
        autoClose={3000} 
        hideProgressBar={false} 
        newestOnTop={false} 
        closeOnClick 
        rtl={false} 
        pauseOnFocusLoss 
        draggable 
        pauseOnHover 
      />
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
    </>
  );
};

export default Calendar;