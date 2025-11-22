import React, { createContext, useContext } from 'react'
import { Asset } from '../assets/types'

type AssetMap = Record<string, Asset>

const AssetContext = createContext<AssetMap>({})

export const AssetProvider = AssetContext.Provider

export function useAssets() {
    return useContext(AssetContext)
}

export function useAsset(id: string) {
    const assets = useAssets()
    return assets[id]
}
