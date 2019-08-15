import * as MRE from '@microsoft/mixed-reality-extension-sdk';

export default class FakeUser implements MRE.UserLike {
	public id: string;
	public name: string;
	public properties: { remoteAddress: string; };
	public groups = 1;
	public constructor(name: string, ip: string) {
		this.id = Math.floor(Math.random() * 0xffffffff).toString(16);
		this.name = name;
		this.properties = {
			remoteAddress: ip
		};
	}
}