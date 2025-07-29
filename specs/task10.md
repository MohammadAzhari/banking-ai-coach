
Now after creating the short report

We need to update the life report, after each short report creation

The long report will be much simmilar but it should be only one for each user,

here is the complete flow:
<current>
reciving POST /reports/short
system will create a short report
ask ai for context of the short report
update the short report with the context
send the short report to the user
</current>

<next>
get life report
if not exist create it with the same short report
else update it with the short report
genereta ai context for the life report
instead of using the transactions, use the previous 10 short reports and the previous life report as will
ask ai for context of the life report
update the life report with the context
dont send the life report to the user
</next>
