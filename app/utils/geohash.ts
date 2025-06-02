const BASE32 = '0123456789bcdefghjkmnpqrstuvwxyz'
const base32Map: Record<string, number> = {}
for (let i = 0; i < BASE32.length; i++) {
  base32Map[BASE32[i]] = i
}

export function decodeGeohash(geohash: string): [number, number] {
  let even = true
  let latMin = -90
  let latMax = 90
  let lonMin = -180
  let lonMax = 180

  for (const char of geohash) {
    const bits = base32Map[char]
    if (bits === undefined) {
      throw new Error(`Invalid geohash character: ${char}`)
    }

    for (let mask = 16; mask > 0; mask >>= 1) {
      if (even) {
        const mid = (lonMin + lonMax) / 2
        if (bits & mask) {
          lonMin = mid
        } else {
          lonMax = mid
        }
      } else {
        const mid = (latMin + latMax) / 2
        if (bits & mask) {
          latMin = mid
        } else {
          latMax = mid
        }
      }
      even = !even
    }
  }

  const lat = (latMin + latMax) / 2
  const lon = (lonMin + lonMax) / 2
  return [lat, lon]
}

export function encodeGeohash(lat: number, lon: number, precision: number): string {
  let isEven = true
  let bit = 0
  let ch = 0
  let geohash = ''
  let latMin = -90
  let latMax = 90
  let lonMin = -180
  let lonMax = 180

  while (geohash.length < precision) {
    if (isEven) {
      const mid = (lonMin + lonMax) / 2
      if (lon >= mid) {
        ch |= 1 << (4 - bit)
        lonMin = mid
      } else {
        lonMax = mid
      }
    } else {
      const mid = (latMin + latMax) / 2
      if (lat >= mid) {
        ch |= 1 << (4 - bit)
        latMin = mid
      } else {
        latMax = mid
      }
    }
    isEven = !isEven
    if (bit < 4) {
      bit++
    } else {
      geohash += BASE32[ch]
      bit = 0
      ch = 0
    }
  }
  return geohash
}