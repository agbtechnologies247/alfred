import { createFileRoute } from '@tanstack/react-router';
import { Download, FileText } from 'lucide-react';

export const Route = createFileRoute('/reports')({
  component: ReportsDashboard,
});

function ReportsDashboard() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
        <button className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 flex items-center gap-2">
          <Download className="w-4 h-4" /> Export All
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 rounded-xl border border-border bg-card hover:border-primary/50 transition-colors cursor-pointer flex items-start gap-4">
          <div className="p-3 bg-primary/10 rounded-lg text-primary">
            <FileText className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-lg">Weekly SLA Report</h3>
            <p className="text-sm text-muted-foreground mt-1">Generated automatically every Monday. Contains uptime, MTTR, and critical incident summaries.</p>
            <div className="mt-4 text-sm font-medium text-primary">View Report →</div>
          </div>
        </div>

        <div className="p-6 rounded-xl border border-border bg-card hover:border-primary/50 transition-colors cursor-pointer flex items-start gap-4">
          <div className="p-3 bg-primary/10 rounded-lg text-primary">
            <FileText className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-lg">Cost Optimization Summary</h3>
            <p className="text-sm text-muted-foreground mt-1">Monthly breakdown of AI-recommended infrastructure savings and action items.</p>
            <div className="mt-4 text-sm font-medium text-primary">View Report →</div>
          </div>
        </div>
      </div>
    </div>
  );
}
