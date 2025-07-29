

Now we need to work on the short report generation feautre, currently it's fine it's generating some fixed json response, but we need to make benefit from the contexts of the transactions, so we need to add a new feild to the short report table called context, and after generating the short report, we need to update this field with the ai response

i made adjustments to the reports table, you have to fix the errors in the reports service and create the method within the ai service to generate context for the report