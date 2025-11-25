import { NextRequest } from 'next/server';
import { getConfig } from '@/config';

function isIpInCidr(ip: string, cidr: string): boolean {
    if (!cidr.includes('/')) {
        return ip === cidr;
    }

    const [network, bits] = cidr.split('/');
    const mask = ~(2 ** (32 - parseInt(bits, 10)) - 1);

    const ipNum = ip.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet, 10), 0);
    const networkNum = network.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet, 10), 0);

    return (ipNum & mask) === (networkNum & mask);
}

export function isIpAllowed(request: NextRequest): boolean {
    const config = getConfig();

    if (!config.allowedIps || config.allowedIps.length === 0) {
        return true;
    }

    // 클라이언트 IP 추출 (x-forwarded-for 또는 x-real-ip 헤더에서)
    const forwardedFor = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');

    const ip = forwardedFor
        ? forwardedFor.split(',')[0].trim()
        : realIp || 'unknown';

    if (ip === 'unknown') {
        console.warn('⚠️  Could not determine client IP address');
        return false;
    }

    return config.allowedIps.some(allowedIp => isIpInCidr(ip, allowedIp));
}
