import React from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { SectionCard } from '@/components/sales/SectionCard';
import { EmptyState } from '@/components/sales/EmptyState';
import { Wallet } from 'lucide-react';

const CollectionHistory: React.FC = () => {
  const [selectedMonth, setSelectedMonth] = React.useState(new Date());

  return (
    <MainLayout>
      <PageHeader
        title="Collection History"
        subtitle="View all collection records by date"
        selectedMonth={selectedMonth}
        onMonthChange={setSelectedMonth}
        pdfElementId="collection-history-content"
      />

      <div id="collection-history-content" className="flex-1 overflow-auto p-4 lg:p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <SectionCard>
            <EmptyState
              title="No Collections Found"
              description="Collection records will appear here once data is added."
              icon={<Wallet className="h-8 w-8 text-muted-foreground" />}
            />
          </SectionCard>
        </div>
      </div>
    </MainLayout>
  );
};

export default CollectionHistory;
