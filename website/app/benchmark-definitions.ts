export const targetRows=[
 ['Window end','Within-subject','Random Forest',9.457,13.183,.678],['Window end','Within-subject','TCN',8.388,12.153,.733],
 ['Window end','Cross-subject','Random Forest',9.591,13.639,.634],['Window end','Cross-subject','TCN',8.840,12.515,.672],
 ['Window center · offline','Within-subject','Random Forest',9.109,12.711,.703],['Window center · offline','Within-subject','TCN',7.897,11.385,.766],
 ['Window center · offline','Cross-subject','Random Forest',9.260,13.182,.663],['Window center · offline','Cross-subject','TCN',8.613,12.215,.698],
 ['Forecast · +100 ms','Within-subject','Random Forest',9.761,13.549,.658],['Forecast · +100 ms','Within-subject','TCN',8.772,12.702,.706],
 ['Forecast · +100 ms','Cross-subject','Random Forest',9.864,13.969,.614],['Forecast · +100 ms','Cross-subject','TCN',9.470,13.527,.620]
].map(([target,split,model,mae,rmse,r])=>({target:String(target),split:String(split),model:String(model),mae:Number(mae),rmse:Number(rmse),r:Number(r)}));
export const frequency=[
 {model:'Full-band',band:'No additional frequency-selective filtering',mae:7.751,rmse:10.941,r:.778},
 {model:'20 Hz low-pass',band:'≤ 20 Hz',mae:7.405,rmse:10.338,r:.794},
 {model:'5–100 Hz band-pass',band:'Primary paper benchmark',mae:9.591,rmse:13.639,r:.634},
 {model:'100–760 Hz band-pass',band:'Exploratory digital representation',mae:12.215,rmse:16.608,r:.387},
];
