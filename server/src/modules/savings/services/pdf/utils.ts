export const formatDate = (date: string | Date): string => {
    const d = new Date(date);
    return d.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });
};
