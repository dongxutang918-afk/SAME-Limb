// Fig. 1(a): positions in the EMG device's local front view, in meters.
// Ordering is source-defined; spacing is an illustration estimated from the photo.
export const amgPlacement=[
 {label:'AMG1',location:'Above EMG',mount:[0,.032,0],exploded:[0,.064,.035]},
 {label:'AMG2',location:'Upper right of EMG',mount:[.021,.014,0],exploded:[.071,.028,.035]},
 {label:'AMG3',location:'Lower right of EMG',mount:[.021,-.014,0],exploded:[.071,-.028,.035]},
 {label:'AMG4',location:'Below EMG',mount:[0,-.032,0],exploded:[0,-.064,.035]},
] as const;
