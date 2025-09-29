// CSV Export utility functions

export interface CSVExportData {
  [key: string]: string | number | null | undefined;
}

export function generateCSV(data: CSVExportData[], filename: string): void {
  if (!data || data.length === 0) {
    console.warn('No data to export');
    return;
  }

  // Get headers from the first row
  const headers = Object.keys(data[0]);
  
  // Create CSV content
  const csvContent = [
    // Header row
    headers.join(','),
    // Data rows
    ...data.map(row => 
      headers.map(header => {
        const value = row[header];
        // Handle null/undefined values and escape commas in strings
        if (value === null || value === undefined) return '';
        let stringValue = String(value);
        
        // CSV Injection Prevention: Prefix potentially dangerous values with single quote
        if (/^[=+\-@]/.test(stringValue)) {
          stringValue = "'" + stringValue;
        }
        
        // If the value contains commas, quotes, or newlines, wrap in quotes and escape existing quotes
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n') || /^[=+\-@]/.test(String(value))) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      }).join(',')
    )
  ].join('\n');

  // Create and trigger download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

// Mock data generators for testing
export function generateMockTasksCSV(): void {
  const mockTasks = [
    {
      id: 'T001',
      title: 'Creazione campagna Facebook',
      priority: 'P1',
      status: 'In Progress',
      assignee: 'Mario Rossi',
      campaign: 'Campagna Estate 2024',
      dueDate: '2024-02-15',
      created: '2024-02-01'
    },
    {
      id: 'T002', 
      title: 'Analisi metriche Instagram',
      priority: 'P2',
      status: 'Done',
      assignee: 'Laura Bianchi',
      campaign: 'Campagna Primavera',
      dueDate: '2024-02-10',
      created: '2024-01-28'
    },
    {
      id: 'T003',
      title: 'Preparazione contenuti LinkedIn',
      priority: 'P0',
      status: 'Backlog',
      assignee: 'Paolo Verdi',
      campaign: 'Campagna B2B',
      dueDate: '2024-02-20',
      created: '2024-02-03'
    }
  ];

  generateCSV(mockTasks, 'tasks_export');
}

export function generateMockLeadsCSV(): void {
  const mockLeads = [
    {
      id: 'L001',
      firstName: 'Giuseppe',
      lastName: 'Martini',
      email: 'g.martini@azienda.it',
      phone: '+39 340 123 4567',
      company: 'Martini Industries SRL',
      source: 'Website',
      status: 'Qualified',
      priority: 'P1',
      score: 85,
      createdDate: '2024-01-15',
      lastContact: '2024-02-01'
    },
    {
      id: 'L002',
      firstName: 'Francesca',
      lastName: 'Romano',
      email: 'f.romano@techsolution.com',
      phone: '+39 347 987 6543',
      company: 'TechSolution SpA',
      source: 'LinkedIn',
      status: 'Contacted',
      priority: 'P2', 
      score: 72,
      createdDate: '2024-01-20',
      lastContact: '2024-01-25'
    },
    {
      id: 'L003',
      firstName: 'Alessandro',
      lastName: 'Conti',
      email: 'a.conti@startup.io',
      phone: '+39 333 555 7890',
      company: 'Innovative Startup SRL',
      source: 'Referral',
      status: 'New',
      priority: 'P0',
      score: 90,
      createdDate: '2024-02-05',
      lastContact: null
    }
  ];

  generateCSV(mockLeads, 'leads_export');
}