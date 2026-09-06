/** Concise summaries of SI Table S2 and sections S4–S6. */
export const protocolBriefs:Record<string,string>={
 'Quiet Stand':'Stand upright with feet about shoulder-width apart. Hold the posture throughout the recording.',
 'Quiet Sit':'Sit with the trunk upright and legs relaxed. Remain seated throughout the recording.',
 'Deadlift':'With feet shoulder-width apart, lower and lift the box in about 4 seconds. Use two A4-paper reams as the load and adjust the starting box height to the participant.',
 'Deep Squat':'Use the same foot placement and height-adjusted box setup as the deadlift, with no standardized load inside. Complete the squat to the auditory cues.',
 'Stair Ascent':'Lead upward with the left leg and use the right leg on the downward phase. Keep the step setup the same across trials.',
 'Left Lunge':'Set the left foot at about 45°, relax the right leg, and move the left knee beyond the toes, following the study’s prescribed form.',
 'Single-leg Stance':'Raise the right leg and establish balance before recording. Hold the stance with the raised toes approximately parallel to the floor.',
 'Forward Lunge':'Set the relative foot angle to about 30° and move the front knee beyond the toes, following the study’s prescribed form.',
 'Vertical Jump':'Begin with feet shoulder-width apart. Jump vertically in place and land back in the starting area.',
 'Stand-sit transition':'Begin standing with the chair’s front edge aligned to the back of the lower legs/heels. Perform the instructed transition to the auditory cues.',
 'Heel Raise':'Start with feet shoulder-width apart. Raise both heels within each auditory-cue interval.',
};
for(const speed of [1,2,3,4,5])protocolBriefs[`Walk at ${speed} km/h`]=`Set the treadmill to ${speed} km/h and allow walking to stabilize. Record approximately 15 seconds at this speed.`;
