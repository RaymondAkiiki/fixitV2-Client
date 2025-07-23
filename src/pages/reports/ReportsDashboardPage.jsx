import React from 'react';
import { Link } from 'react-router-dom';
import { 
  BarChart, 
  AreaChart, 
  Calendar, 
  Users, 
  DollarSign, 
  Wrench, 
  ClipboardList,
  FileText,
  ExternalLink
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { USER_ROLES } from '../../utils/constants';

// Branding
const PRIMARY_COLOR = "#219377";
const SECONDARY_COLOR = "#ffbd59";

const ReportsDashboardPage = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === USER_ROLES.ADMIN;
  const isPropertyManager = user?.role === USER_ROLES.PROPERTY_MANAGER;
  const isLandlord = user?.role === USER_ROLES.LANDLORD;

  const reportTypes = [
    {
      id: 'maintenance',
      title: 'Maintenance Reports',
      description: 'View reports on maintenance requests, response times, and resolution rates.',
      icon: <Wrench className="h-8 w-8" style={{ color: SECONDARY_COLOR }} />,
      path: '/reports/maintenance',
      color: '#e6f7ff',
      access: isAdmin || isPropertyManager || isLandlord
    },
    {
      id: 'scheduled-maintenance',
      title: 'Scheduled Maintenance Reports',
      description: 'Track scheduled maintenance tasks, completion rates, and upcoming work.',
      icon: <Calendar className="h-8 w-8" style={{ color: SECONDARY_COLOR }} />,
      path: '/reports/scheduled-maintenance',
      color: '#f0f9ff',
      access: isAdmin || isPropertyManager || isLandlord
    },
    {
      id: 'vendor-performance',
      title: 'Vendor Performance Reports',
      description: 'Analyze vendor performance metrics, costs, and response times.',
      icon: <Users className="h-8 w-8" style={{ color: SECONDARY_COLOR }} />,
      path: '/reports/vendor-performance',
      color: '#f5f3ff',
      access: isAdmin || isPropertyManager || isLandlord
    },
    {
      id: 'rent',
      title: 'Rent Collection Reports',
      description: 'Review rent collection metrics, payment trends, and outstanding balances.',
      icon: <DollarSign className="h-8 w-8" style={{ color: SECONDARY_COLOR }} />,
      path: '/reports/rent',
      color: '#f0fdf4',
      access: isAdmin || isPropertyManager || isLandlord
    },
    {
      id: 'lease',
      title: 'Lease Reports',
      description: 'View lease expiry reports, renewal statistics, and occupancy rates.',
      icon: <FileText className="h-8 w-8" style={{ color: SECONDARY_COLOR }} />,
      path: '/reports/lease',
      color: '#fef3f2',
      access: isAdmin || isPropertyManager || isLandlord
    },
    {
      id: 'common-issues',
      title: 'Common Issues Analysis',
      description: 'Identify recurring issues and maintenance patterns across properties.',
      icon: <AreaChart className="h-8 w-8" style={{ color: SECONDARY_COLOR }} />,
      path: '/reports/common-issues',
      color: '#fff9f5',
      access: isAdmin || isPropertyManager
    }
  ];

  const filteredReportTypes = reportTypes.filter(report => report.access);

  return (
    <div className="p-4 md:p-8 min-h-full" style={{ background: "#f9fafb" }}>
      <h1 className="text-3xl font-extrabold mb-7 border-b pb-3 flex items-center"
        style={{ color: PRIMARY_COLOR, borderColor: PRIMARY_COLOR }}>
        <BarChart className="w-8 h-8 mr-3" style={{ color: SECONDARY_COLOR }} />
        Reports Dashboard
      </h1>

      <div className="mb-8">
        <p className="text-gray-600 text-lg">
          Select a report category to view detailed analytics and export data.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredReportTypes.map((report) => (
          <Link 
            key={report.id}
            to={report.path}
            className="block p-6 rounded-lg shadow-md border transition-all hover:shadow-lg transform hover:-translate-y-1"
            style={{ borderColor: PRIMARY_COLOR + '30', background: report.color }}
          >
            <div className="flex items-start">
              <div className="p-3 rounded-lg mr-4" style={{ backgroundColor: PRIMARY_COLOR + '15' }}>
                {report.icon}
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2 flex items-center" style={{ color: PRIMARY_COLOR }}>
                  {report.title}
                  <ExternalLink className="h-4 w-4 ml-2 opacity-60" />
                </h3>
                <p className="text-gray-600">{report.description}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-10 p-6 rounded-lg shadow-md border" style={{ borderColor: PRIMARY_COLOR + '30', background: '#fff' }}>
        <h2 className="text-xl font-semibold mb-4 flex items-center" style={{ color: PRIMARY_COLOR }}>
          <ClipboardList className="h-6 w-6 mr-2" style={{ color: SECONDARY_COLOR }} />
          Need Help with Reports?
        </h2>
        <p className="text-gray-600 mb-4">
          Our reporting system allows you to analyze data, identify trends, and make data-driven decisions. 
          Each report type offers different insights into your property management operations.
        </p>
        <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
          <li>Use filters to narrow down data to specific properties, date ranges, and categories</li>
          <li>Export reports in CSV format for further analysis in spreadsheet applications</li>
          <li>Generate PDF reports for professional presentations and record-keeping</li>
          <li>Schedule automated reports by setting up preferences in your account settings</li>
        </ul>
      </div>
    </div>
  );
};

export default ReportsDashboardPage;