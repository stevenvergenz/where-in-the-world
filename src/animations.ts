import * as MRE from '@microsoft/mixed-reality-extension-sdk';
const globeSpin: Array<MRE.AnimationKeyframe> = [
	{
		time: 0,
		value: {
			transform: {
				local: { rotation: MRE.Quaternion.FromEulerAngles(0, 0, 0) }
			}
		}
	},
	{
		time: 10,
		value: {
			transform: {
				local: { rotation: MRE.Quaternion.FromEulerAngles(0, -0.66 * Math.PI, 0) }
			}
		}
	},
	{
		time: 20,
		value: {
			transform: {
				local: { rotation: MRE.Quaternion.FromEulerAngles(0, -1.33 * Math.PI, 0) }
			}
		}
	},
	{
		time: 30,
		value: {
			transform: {
				local: { rotation: MRE.Quaternion.FromEulerAngles(0, -2 * Math.PI, 0) }
			}
		}
	}
];
export { globeSpin };