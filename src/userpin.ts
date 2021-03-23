import * as MRE from '@microsoft/mixed-reality-extension-sdk';

import { WhereInTheWorld } from './app';
import { webhost } from './server';

export class Location {
	constructor(
		public coordinates: {
			latitude: number;
			longitude: number;
		},
		public countryCode: string) { }
}

export class UserPin {
	private model: MRE.Actor;
	private label: MRE.Actor;

	constructor(private app: WhereInTheWorld, public displayName: string, public location: Location) {

	}

	public pinToGlobe() {
		if (!this.app.pinPrefab) return;

		this.model = MRE.Actor.CreateFromPrefab(this.app.context, {
			prefabId: this.app.pinPrefab.id,
			actor: {
				parentId: this.app.root.id,
				transform: {
					local: {
						rotation: MRE.Quaternion.FromEulerAngles(
							0,
							-this.location.coordinates.longitude || 0,
							-this.location.coordinates.latitude || 0
						),
					}
				}
			}
		});
		

		this.model.created().then(() => {
			this.model.targetingAnimationsByName.get('ConeAction').play();
			
			[this.label] = this.model.findChildrenByName('Label', true);

			this.label.transform.local.rotation =
				MRE.Quaternion.FromEulerAngles(-this.location.coordinates.latitude, Math.PI / 2, 0);

			this.label.enableText({
				contents: this.displayName,
				anchor: MRE.TextAnchorLocation.MiddleCenter,
				height: 0.1,
				color: { r: 1, g: 0.76, b: 0.89 }
			});
		})
		.catch(reason => console.log(reason));
	}

	public unpinFromGlobe(): void {
		this.model?.destroy();
	}
}