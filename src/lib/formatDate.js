const MONTHS_FULL = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const MONTHS_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export const formatDate = (dateString, format) => {
  const date = new Date(dateString);
  const day = String(date.getUTCDate()).padStart(2, "0");
  const monthIndex = date.getUTCMonth();
  const year = date.getUTCFullYear();

  switch (format) {
    case "DD MMM YYYY":
      return `${day} ${MONTHS_SHORT[monthIndex]} ${year}`;
    case "MMMM YYYY":
      return `${MONTHS_FULL[monthIndex]} ${year}`;
    default:
      return dateString;
  }
};
