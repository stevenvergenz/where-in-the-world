import * as MRE from '@microsoft/mixed-reality-extension-sdk';

import { globeSpin } from './animations';
import FakeUser from './fakeUser';
import fetchJSON from './fetchJSON';
import { webhost } from './server';
import { UserPin, Location } from './userpin';

const API_KEY = process.env['API_KEY'];

/**
 * App
 */
export class WhereInTheWorld {
	public root: MRE.Actor = null;
	public assets: MRE.AssetContainer;
	public globe: MRE.Actor = null;
	private userPins = new Map<string, UserPin>();
	public pinPrefab: MRE.Prefab;

	constructor(public context: MRE.Context, params: MRE.ParameterSet) {
		this.assets = new MRE.AssetContainer(this.context);
		context.onStarted(() => this.started());

		if (params['mode'] === 'testing') {
			this.test();
		}
		else {
			context.onUserJoined(user => this.userJoined(user));
			context.onUserLeft(user => this.userLeft(user));
		}
	}

	private async started(): Promise<void> {
		this.root = MRE.Actor.CreateEmpty(this.context, {
			actor: { name: 'Root' }
		});

		this.globe = MRE.Actor.CreateFromGltf(new MRE.AssetContainer(this.context), {
			uri: `${webhost.baseUrl}/earth.gltf`,
			actor: { parentId: this.root.id }
		});

		this.root.createAnimation('spin', {
			keyframes: globeSpin,
			wrapMode: MRE.AnimationWrapMode.Loop
		});
		this.root.enableAnimation('spin');

		const pinAssets = await this.assets.loadGltf(`${webhost.baseUrl}/pin.glb`);
		this.pinPrefab = pinAssets.find(a => !!a.prefab).prefab;
		for (const userId in this.userPins) {
			this.userPins[userId].pinToGlobe();
		}
	}

	private async userJoined(user: MRE.UserLike): Promise<void> {
		if (user instanceof MRE.User) {
			// ask for permission before looking them up
			const res = await user.prompt("Share your real-world city with the room?");
			if (!res.submitted) { return; }
		}

		let location: Location;
		try {
			location = await this.ipToLocation(user.properties.remoteAddress);
		}
		catch(e) {
			console.error(e);
			return;
		}

		const pin = new UserPin(this, user.name, location);
		this.userPins.set(user.id, pin);
		pin.pinToGlobe();
	}

	private userLeft(user: MRE.User): void {
		if (this.userPins.has(user.id)) {
			const pin = this.userPins.get(user.id);
			pin.unpinFromGlobe();
			this.userPins.delete(user.id);
		}
	}

	private async ipToLocation(ip: string): Promise<Location> {
		const res = await fetchJSON(`http://api.ipapi.com/${ip}?access_key=${API_KEY}`);

		// latitude +N, longitude +E, country_code
		return new Location(
			{
				latitude: res.latitude * MRE.DegreesToRadians,
				longitude: res.longitude * MRE.DegreesToRadians
			},
			res.country_code
		);
	}

	private test(): void {
		this.userJoined(new FakeUser('Seattle', '216.243.34.181'));
		this.userJoined(new FakeUser('Richmond', '208.253.114.165'));
		this.userJoined(new FakeUser('Sydney', '121.200.30.147'));
		this.userJoined(new FakeUser('Shanghai', '116.236.216.116'));
	}
}