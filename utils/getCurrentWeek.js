module.exports = function(){

const now = new Date();

const day = now.getDay(); // Sunday = 0

const sunday = new Date(now);

sunday.setDate(now.getDate() - day);

const year = sunday.getFullYear();

const firstSunday = new Date(year, 0, 1);

const week = Math.floor(
(
sunday - firstSunday
) / 86400000 / 7
) + 1;

return `${year}-${week}`;

};
