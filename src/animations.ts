import * as MRE from '@microsoft/mixed-reality-extension-sdk';
const globeSpin: MRE.AnimationDataLike = {
	tracks: [{
		target: MRE.ActorPath("globe").transform.local.rotation,
		keyframes: [{
			time: 0,
			value: MRE.Quaternion.FromEulerAngles(0, 0, 0)
		}, {
			time: 10,
			value: MRE.Quaternion.FromEulerAngles(0, -0.66 * Math.PI, 0)
		}, {
			time: 20,
			value: MRE.Quaternion.FromEulerAngles(0, -1.33 * Math.PI, 0)
		}, {
			time: 30,
			value: MRE.Quaternion.FromEulerAngles(0, -2 * Math.PI, 0)
		}]
	}]
};
export { globeSpin };