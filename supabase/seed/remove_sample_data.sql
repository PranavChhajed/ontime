-- Removes the four "Sample ..." employees, their records and the sample holiday.
-- Run this when the app is finished and real employees are being entered.
-- (Months you have closed refuse record deletes: reopen them first, or run
--  this before closing any month that contains sample data.)
delete from public.day_records
 where employee_id in (select id from public.employees where name like 'Sample %');
delete from public.employees where name like 'Sample %';
delete from public.holidays where name = 'Sample holiday';
