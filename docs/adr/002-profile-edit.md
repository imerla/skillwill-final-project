# ADR 002: Current Password Placement in Profile Edit

## Status
Accepted

## Context
When implementing the profile edit feature (FE-004), we needed to decide where to place the "current password" field that is required for all profile updates. Two main approaches were considered:

1. **Confirmation modal**: Show the current password field in a modal that appears when the user clicks "Save Changes"
2. **Inline field**: Place the current password field at the end of the form

## Decision
We chose to place the current password field at the end of the form (inline), rather than using a confirmation modal.

## Rationale

### User Experience
- **Simpler flow**: Users can fill out all their information in one continuous form without interruption
- **Clearer intent**: The current password field is visible from the start, making it obvious that authentication is required
- **Fewer clicks**: No need to open a modal and re-enter information
- **Better mobile experience**: Modals can be cumbersome on smaller screens; inline forms work better across all device sizes

### Security Considerations
- **Same security**: Both approaches require the current password before any changes are committed
- **No additional exposure**: The password field is always a password input type, so it's never visible
- **Consistent with existing patterns**: The registration form uses inline password fields, maintaining consistency

### Technical Simplicity
- **Less state management**: No need to manage modal open/close state
- **Simpler validation**: All form validation happens in one place with React Hook Form
- **Easier error handling**: Field-level errors are displayed directly beside the relevant input
- **Reduced complexity**: Fewer components and less code to maintain

### Accessibility
- **Better keyboard navigation**: Users can tab through the entire form without modal focus management
- **Screen reader friendly**: Linear form structure is easier to navigate than modal overlays
- **Fewer focus traps**: No need to manage focus trapping within a modal

## Consequences

### Positive
- Simpler implementation with fewer components
- Better mobile and accessibility experience
- Consistent with existing form patterns in the application
- Easier to maintain and debug

### Negative
- The current password field is always visible, which some users might find slightly cluttered
- Users must scroll to the bottom if they only want to change fields at the top (mitigated by keeping the form reasonably sized)

## Alternatives Considered

### Confirmation Modal
**Pros:**
- Could hide the password field until needed
- Might feel more "secure" to some users

**Cons:**
- Adds complexity with modal state management
- Interrupts the user flow
- Worse mobile experience
- More accessibility challenges with focus management
- Requires additional component and styling

## References
- FE-004 Profile Edit assignment requirements
- Existing registration form pattern in the application

