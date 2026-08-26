






Part II: unassigned jobs requirements
This is the second core decision area.

Need to add:

An unassigned job state
Jobs that are booked but not assigned to a specific technician
A policy for how these jobs affect capacity
A dispatcher-facing warning or indicator when future capacity may be consumed
The key product question is:

Should an unassigned HVAC job reduce future HVAC capacity?
Should it reserve capacity from any HVAC-certified technician?
Should the scheduler treat it as blocked capacity, provisional capacity, or a soft warning?
We need a clear decision model. The prototype should probably support at least one of these:

soft warning state
hard capacity reduction
assignment panel to resolve the unassigned job



jobs should show the customer name, not job type in the wording.

cursor shoudl be set to grab when we hover over jobs on the calendar.

cursor shoudl be point for unassigned jobs.


cursor default shoudl be default.


hovering over a cell in multi skill scheduler should highlight the time in theat row and the tech (or unassinged) in that column