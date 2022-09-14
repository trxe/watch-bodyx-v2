export const classList = (...cls: string[]) => {
    return cls.join(' ');
}

export const dayOfWeek = [
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
    'Sunday',
]

export const months = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
];

export const timeFormat = (datetimeISO: string): string => {
    const datetime = new Date(datetimeISO);
    const time = `${datetime.getHours().toString().padStart(2, '0')}:${datetime.getMinutes().toString().padStart(2, '0')}`;
    return time;
}

export const dateFormat = (datetimeISO: string): string => {
    const datetime = new Date(datetimeISO);
    const day = dayOfWeek[datetime.getDay()];
    const date = datetime.getDate();
    const month = months[datetime.getMonth()];
    const year = datetime.getFullYear();
    return `${day}, ${date} ${month} ${year}`;
}

export const getTimeTo = (datetimeISO: string): string => {
    const timeDiff = new Date(datetimeISO).getTime() - new Date().getTime();
    const days = Math.round(timeDiff / (1000*60*60*24));
    const hours = Math.round((timeDiff / (1000*60*60)) % 24);
    const mins = Math.round((timeDiff / (1000*60)) % (60));
    return `${days} days, ${hours} hours, ${mins} mins`;
}
