export default class FakeUser {
	public id: string;
	public name: string;
	public properties: { remoteAddress: string; };
	public constructor(name: string, ip: string) {
		this.id = Math.floor(Math.random() * 0xffffffff).toString(16);
		this.name = name;
		this.properties = {
			remoteAddress: ip
		};
	}
}