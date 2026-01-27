import React from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { SectionCard } from '@/components/sales/SectionCard';
import { EmptyState } from '@/components/sales/EmptyState';
import { Package } from 'lucide-react';

const CollectionItems: React.FC = () => {
  const [selectedMonth, setSelectedMonth] = React.useState(new Date());

  return (
    <MainLayout>
      <PageHeader
        title="Collection Items"
        subtitle="View all collection items and details"
        selectedMonth={selectedMonth}
        onMonthChange={setSelectedMonth}
        pdfElementId="collection-items-content"
      />

      <div id="collection-items-content" className="flex-1 overflow-auto p-4 lg:p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <SectionCard>
            <EmptyState
              title="No Collection Items Found"
              description="Collection items will appear here once data is added."
              icon={<Package className="h-8 w-8 text-muted-foreground" />}
            />
          </SectionCard>
        </div>
      </div>
    </MainLayout>
  );
};

export default CollectionItems;
