import React from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import Select from 'react-select';

const ActivityFilter = ({
  keyword,
  setKeyword,
  clients,
  selectedClientFilter,
  setSelectedClientFilter,
  users,
  assignedToFilter,
  setAssignedToFilter,
  statusFilter,
  setStatusFilter,
  statusOptions,
  methodFilter,
  setMethodFilter,
  methodOptions,
  dateFromFilter,
  setDateFromFilter,
  dateToFilter,
  setDateToFilter,
  setDateRangePreset,
  sortField,
  setSortField,
  sortDirection,
  setSortDirection,
  handleResetFilters
}) => {
  return (
    <div className="p-4 mb-6 bg-gray-50 rounded-md border">
      <h3 className="mb-3 text-lg font-bold text-gray-700">Filter Activities</h3>
      
      <div className="flex flex-wrap gap-2 mb-4">
        <button onClick={() => setDateRangePreset('Today')} className="px-2 py-1 text-xs btn-secondary">Today</button>
        <button onClick={() => setDateRangePreset('Yesterday')} className="px-2 py-1 text-xs btn-secondary">Yesterday</button>
        <button onClick={() => setDateRangePreset('ThisWeek')} className="px-2 py-1 text-xs btn-secondary">This Week</button>
        <button onClick={() => setDateRangePreset('LastWeek')} className="px-2 py-1 text-xs btn-secondary">Last Week</button>
        <button onClick={() => setDateRangePreset('ThisMonth')} className="px-2 py-1 text-xs btn-secondary">This Month</button>
        <button onClick={() => setDateRangePreset('LastMonth')} className="px-2 py-1 text-xs btn-secondary">Last Month</button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div>
          <label htmlFor="keywordFilter" className="block mb-1 text-sm font-medium text-gray-700">Keyword</label>
          <input 
            type="text"
            id="keywordFilter"
            placeholder="Client, Subject, Details..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            className="block px-3 py-2 mt-1 w-full rounded-md border border-gray-300 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
        </div>
        
        <div>
          <label htmlFor="clientFilter" className="block mb-1 text-sm font-medium text-gray-700">Client</label>
          <Select
              id="clientFilter"
              options={clients}
              value={selectedClientFilter}
              onChange={(option) => setSelectedClientFilter(option)}
              placeholder="All Clients"
              isClearable
              className="block mt-1 w-full sm:text-sm react-select-container"
              classNamePrefix="react-select"
          />
        </div>

        <div>
          <label htmlFor="assignedToFilter" className="block mb-1 text-sm font-medium text-gray-700">Assigned To</label>
          <Select
              id="assignedToFilter"
              options={users}
              value={assignedToFilter}
              onChange={(option) => setAssignedToFilter(option)}
              placeholder="Any Staff"
              isClearable
              className="block mt-1 w-full sm:text-sm react-select-container"
              classNamePrefix="react-select"
          />
        </div>

        <div>
          <label htmlFor="statusFilter" className="block mb-1 text-sm font-medium text-gray-700">Status</label>
          <select 
            id="statusFilter" 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
            className="block px-3 py-2 mt-1 w-full bg-white rounded-md border border-gray-300 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          >
            <option value="">All Statuses</option>
            {statusOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
        </div>

        <div>
          <label htmlFor="methodFilter" className="block mb-1 text-sm font-medium text-gray-700">Contact Method</label>
          <select 
            id="methodFilter" 
            value={methodFilter} 
            onChange={(e) => setMethodFilter(e.target.value)}
            className="block px-3 py-2 mt-1 w-full bg-white rounded-md border border-gray-300 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          >
            <option value="">All Methods</option>
            {methodOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
        </div>

        <div>
          <label htmlFor="dateFromFilter" className="block mb-1 text-sm font-medium text-gray-700">Date From</label>
          <DatePicker 
            id="dateFromFilter"
            selected={dateFromFilter}
            onChange={date => setDateFromFilter(date)}
            className="block px-3 py-2 mt-1 w-full rounded-md border border-gray-300 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            isClearable
            placeholderText="Select start date"
          />
        </div>

        <div>
          <label htmlFor="dateToFilter" className="block mb-1 text-sm font-medium text-gray-700">Date To</label>
          <DatePicker 
            id="dateToFilter"
            selected={dateToFilter}
            onChange={date => setDateToFilter(date)}
            className="block px-3 py-2 mt-1 w-full rounded-md border border-gray-300 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            isClearable
            placeholderText="Select end date"
            minDate={dateFromFilter}
          />
        </div>

        <div className="grid grid-cols-2 gap-4 lg:col-span-2">
          <div>
              <label htmlFor="sortField" className="block mb-1 text-sm font-medium text-gray-700">Sort By</label>
              <select 
                  id="sortField" 
                  value={sortField} 
                  onChange={(e) => setSortField(e.target.value)} 
                  className="block px-3 py-2 mt-1 w-full bg-white rounded-md border border-gray-300 shadow-sm form-select focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                  <option value="activityTimestamp">Activity Date</option>
                  <option value="clientName">Client Name</option>
                  <option value="status">Status</option>
                  <option value="priority">Priority</option>
                  <option value="lastModifiedAt">Last Modified</option>
              </select>
          </div>
          <div>
              <label htmlFor="sortDirection" className="block mb-1 text-sm font-medium text-gray-700">Direction</label>
              <select 
                  id="sortDirection" 
                  value={sortDirection} 
                  onChange={(e) => setSortDirection(e.target.value)} 
                  className="block px-3 py-2 mt-1 w-full bg-white rounded-md border border-gray-300 shadow-sm form-select focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                  <option value="desc">Descending</option>
                  <option value="asc">Ascending</option>
              </select>
          </div>
        </div>
      
        <div className="flex justify-end items-end md:col-start-4">
          <button 
              onClick={handleResetFilters} 
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-300 rounded-md hover:bg-gray-400"
          >
              Reset Filters
          </button>
        </div>
      </div>
    </div>
  );
};

export default ActivityFilter; 