import * as MRE from '@microsoft/mixed-reality-extension-sdk';

import { globeSpin } from './animations';
import FakeUser from './fakeUser';
import fetchJSON from './fetchJSON';
import { webhost } from './server';
import { UserPin, Location } from './userpin';
import { PrismaClient } from "@prisma/client";

const API_KEY = process.env['API_KEY'];

// cache in miliseconds
const MAX_CACHE_TIME = process.env['MAX_CACHE_TIME'] || 7 * 24 * 60 * 60 * 1000;
// Load the sqlite db client
const prismaClient = new PrismaClient({
  //log: ['query', 'info', 'warn'],
});


/**
 * App
 */
export class WhereInTheWorld {
	public root: MRE.Actor = null;
	public assets: MRE.AssetContainer;
	public globe: MRE.Actor = null;
	private userPins = new Map<MRE.Guid, UserPin>();
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
		this.root = MRE.Actor.Create(this.context, {
			actor: { name: 'Root' }
		});

		this.globe = MRE.Actor.CreateFromGltf(this.assets, {
			uri: `${webhost.baseUrl}/earth.gltf`,
			actor: { parentId: this.root.id }
		});

		const spinData = this.assets.createAnimationData("spin", globeSpin);
		spinData.bind({ globe: this.root }, { isPlaying: true, wrapMode: MRE.AnimationWrapMode.Loop });

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
			location = await this.ipToLocationCache(user.properties.remoteAddress);
		}
		catch(e) {
			console.error(e);
			return;
		}

		console.log("location", location)

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

	private async ipToLocationCache(ip: string): Promise<Location> {

		const lookupip: any = await prismaClient.ipgeocache.findOne({
			where: {
				ip: ip
			}
		});

		if(lookupip) {
			// found result
			if(new Date().getTime() - lookupip.last_updated <= MAX_CACHE_TIME) {
				// within max cachetime -> return cached result.
				return new Location(
					{
						latitude: lookupip.latitude * MRE.DegreesToRadians,
						longitude: lookupip.longitude * MRE.DegreesToRadians
					},
					lookupip.country_code
				);
			} else {
				// data too old: pull in fresh data.
				return await this.ipToLocation(ip);
			}
		} else {
			// not found: pull in fresh data.
			return await this.ipToLocation(ip);
		}
	}

	private async cacheIP(geoipdata: any) {
		// last_updated
		const unixts = new Date().getTime();
		// insert in db.
		return await prismaClient.ipgeocache.upsert({
			create: {
				ip: geoipdata.ip,
				latitude: geoipdata.latitude,
				longitude: geoipdata.longitude,
				country_code: geoipdata.country_code,
				last_updated: unixts
			},
			update: {
				latitude: geoipdata.latitude,
				longitude: geoipdata.longitude,
				country_code: geoipdata.country_code,
				last_updated: unixts
			},
			where: {
				ip: geoipdata.ip,
			},
		});
	}

	private async ipToLocation(ip: string): Promise<Location> {
		const res = await fetchJSON(`http://api.ipapi.com/${ip}?access_key=${API_KEY}`);

		// store new result in DB if there is a result.
		if(res.ip && res.latitude && res.longitude){
			this.cacheIP(res);
		}

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
