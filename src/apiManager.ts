import * as MRE from '@microsoft/mixed-reality-extension-sdk';

import fetchJSON from './fetchJSON';
import { Location } from './userpin';

interface ExportedPromise<T> {
	promise?: Promise<T>;
	resolve: (value?: T | PromiseLike<T>) => void;
	reject: (reason?: any) => void;
}

const requests = new Map<string, ExportedPromise<Location>>();

async function sendApiRequest() {
	const ips = new Set(requests.keys());
	const ipsString = [...ips].join(',')
	let responses: any;
	try {
		responses = await fetchJSON(`http://api.ipapi.com/${ipsString}`
			+ '?fields=latitude,longitude,country_code'
			+ `&access_key=${process.env.API_KEY}`
		);
	} catch (e) {
		console.error(e);
	}

	if (responses) {
		for (const res of responses) {
			const ep = requests.get(res.ip);
			ep.resolve(new Location(
				{
					latitude: res.latitude * MRE.DegreesToRadians,
					longitude: res.longitude * MRE.DegreesToRadians
				},
				res.country_code
			));
			requests.delete(res.ip);
			ips.delete(res.ip);
		}
	}

	for (const remainder of ips) {
		const ep = requests.get(remainder);
		ep.reject('No response from API');
		requests.delete(remainder);
	}
}

let timer: NodeJS.Timeout;
function resetTimer() {
	if (timer) {
		clearTimeout(timer);
	}
	timer = setTimeout(() => {
		sendApiRequest();
		timer = null;
	}, 2000);
}

export function ipToLocation(ip: string): Promise<Location> {
	if (requests.get(ip)) {
		return requests.get(ip).promise;
	}

	const promise = new Promise<Location>((resolve, reject) => {
		requests.set(ip, { resolve, reject });
		resetTimer();
	});
	return requests.get(ip).promise = promise;
}

/* export async function ipToLocation(ip: string): Promise<Location> {
	const res = await fetchJSON(`http://api.ipapi.com/${ip}?access_key=${API_KEY}`);

	// latitude +N, longitude +E, country_code
	return new Location(
		{
			latitude: res.latitude * MRE.DegreesToRadians,
			longitude: res.longitude * MRE.DegreesToRadians
		},
		res.country_code
	);
} */
