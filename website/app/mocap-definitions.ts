/** Verified marker groups from SI Table S6; indices are zero-based. */
export const jointDefinitions=[
 {id:'left_knee',name:'Left knee',indices:[0,1,3],markers:'L.Thigh → L.Knee → L.Ankle',rule:'Knee angle = 180° − θ'},
 {id:'right_knee',name:'Right knee',indices:[9,10,12],markers:'R.Thigh → R.Knee → R.Ankle',rule:'Knee angle = 180° − θ'},
 {id:'left_ankle',name:'Left ankle',indices:[2,3,5],markers:'L.Shank → L.Ankle → L.Toe',rule:'Ankle angle = θ'},
 {id:'right_ankle',name:'Right ankle',indices:[11,12,14],markers:'R.Shank → R.Ankle → R.Toe',rule:'Ankle angle = θ'},
] as const;
export type JointId=typeof jointDefinitions[number]['id'];
export type SceneMode='sensors'|'mocap';
