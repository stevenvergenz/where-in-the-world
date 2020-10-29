import * as MRE from '@microsoft/mixed-reality-extension-sdk';

export default class FakeUser implements MRE.UserLike {
	public id: MRE.Guid;
	public name: string;
	public properties: { remoteAddress: string; };
	public groups = 1;
	public grantedPermissions: MRE.Permissions[] = [MRE.Permissions.UserTracking];
	public constructor(name: string, ip: string) {
		this.id = MRE.newGuid();
		this.name = name;
		this.properties = {
			remoteAddress: ip
		};
	}
}