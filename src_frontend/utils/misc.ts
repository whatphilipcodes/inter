// import { net as netElectron } from 'electron';
// import net from 'node:net';

// async function getURL(host: string, port = 0): Promise<URL> {
//     const address = await getAddress(host);
//     if (!address) {
//         throw new Error('Could not resolve host');
//     }
//     const freePort = port === 0 ? await getFreePort() : port;
//     return new URL(`http://${address}:${freePort}`);
// }

// async function getFreePort(): Promise<number> {
//     return new Promise<number>(res => {
//         const srv = net.createServer();
//         srv.listen(0, () => {
//             const adress = srv.address() as net.AddressInfo;
//             const port = adress.port;
//             srv.close(() => res(port));
//         });
//     });
// }

// async function getAddress(host: string): Promise<string> {
//     let address = null;
//     try {
//         const resHost = await netElectron.resolveHost(host);
//         for (const endpoint of resHost.endpoints) {
//             if (endpoint.family === 'ipv4') {
//                 address = endpoint.address;
//                 break;
//             }
//         }
//         if (!address) {
//             console.log('No IPv4 address found for', host);
//         }
//     } catch (error) {
//         console.error('Error resolving host:', host);
//     }
//     return address;
// }

// export { getURL };