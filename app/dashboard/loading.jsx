import LoadingOverlay from '@/components/ui/loading-overlay';

export default function Loading() {
  return <LoadingOverlay message="Loading dashboard..." subtitle="Fetching stats, events, and workspace details." />;
}
