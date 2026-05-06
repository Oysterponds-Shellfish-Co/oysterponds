// Currency formatting
export const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
};

// Parse a date string safely without UTC shift.
// "2026-04-30" from Mongo arrives as ISO (T00:00:00Z), which becomes Apr 29
// in US timezones. We extract the date components directly instead.
const parseDateLocal = (dateString: string): Date => {
    // Handle both ISO timestamps and plain YYYY-MM-DD strings
    const iso = dateString.substring(0, 10); // "YYYY-MM-DD"
    const [year, month, day] = iso.split('-').map(Number);
    // Use local noon to avoid any DST edge-cases
    return new Date(year, month - 1, day, 12, 0, 0);
};

// Date formatting
export const formatDate = (dateString: string): string => {
    return parseDateLocal(dateString).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });
};

// Short date format
export const formatShortDate = (dateString: string): string => {
    return parseDateLocal(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
    });
};

// Get next Thursday (delivery day)
export const getNextThursday = (): Date => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const daysUntilThursday = (4 - dayOfWeek + 7) % 7 || 7;
    const nextThursday = new Date(today);
    nextThursday.setDate(today.getDate() + daysUntilThursday);
    nextThursday.setHours(0, 0, 0, 0);
    return nextThursday;
};

// Check if date is valid Thursday for orders (must be ordered by Tuesday)
export const isValidDeliveryDate = (date: Date): boolean => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Must be a Thursday
    if (date.getDay() !== 4) return false;

    // Calculate Tuesday before that Thursday
    const orderDeadline = new Date(date);
    orderDeadline.setDate(orderDeadline.getDate() - 2);
    orderDeadline.setHours(23, 59, 59, 999);

    // Today must be before or on the Tuesday deadline
    return today <= orderDeadline;
};

// Get all valid upcoming Thursdays for order form
export const getUpcomingThursdays = (count: number = 4): Date[] => {
    const thursdays: Date[] = [];
    const nextThursday = getNextThursday();

    for (let i = 0; i < count; i++) {
        const thursday = new Date(nextThursday);
        thursday.setDate(thursday.getDate() + (i * 7));

        if (isValidDeliveryDate(thursday)) {
            thursdays.push(thursday);
        }
    }

    // If first Thursday is past deadline, start from next week
    if (thursdays.length === 0) {
        for (let i = 1; i <= count; i++) {
            const thursday = new Date(nextThursday);
            thursday.setDate(thursday.getDate() + (i * 7));
            thursdays.push(thursday);
        }
    }

    return thursdays;
};

// Generate slug from business name
export const generateSlug = (name: string): string => {
    return name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
};

// Days until date
export const daysUntil = (date: Date): number => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(date);
    target.setHours(0, 0, 0, 0);
    return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
};
