export const formatDateMonth = (dateStr: string) => {
    if (!dateStr) return '';
    
    // Options for toLocaleDateString to ensure GMT+8 (Asia/Manila)
    const localeOptions: Intl.DateTimeFormatOptions = { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric', 
        timeZone: 'Asia/Manila' 
    };

    // Handle "YYYY-MM-DD to YYYY-MM-DD" format
    if (dateStr.includes(' to ')) {
        const [start, end] = dateStr.split(' to ');
        const startDate = new Date(start);
        const endDate = new Date(end);
        
        const format = (d: Date) => d.toLocaleDateString('en-US', localeOptions);
        return `${format(startDate)} - ${format(endDate)}`;
    }

    // Handle YYYY-MM format
    if (dateStr.match(/^\d{4}-\d{2}$/)) {
        const [year, month] = dateStr.split('-');
        const date = new Date(parseInt(year), parseInt(month) - 1);
        return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric', timeZone: 'Asia/Manila' });
    }
    return dateStr;
};
