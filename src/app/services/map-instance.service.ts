import { Injectable, NgZone, OnDestroy } from '@angular/core';
import { IMapInit, MapService } from './map.service';
import L, { icon } from 'leaflet';
import { IRealm } from '../interfaces/realm.interface';
import { EventService } from './event.service';
import { SubscriptionBag } from '../helpers/subscription-bag';
import { IArea } from '../interfaces/area.interface';
import { Router } from '@angular/router';
import { IMapShrine } from '../interfaces/map-shrine.interface';
import { nanoid } from 'nanoid';
import { StorageService } from './storage.service';

const opacityFound = 0.4;

@Injectable()
export class MapInstanceService implements OnDestroy {
  _map?: L.Map;
  _subs = new SubscriptionBag();

  private _icons: { [key: string]: L.Icon } = {};

  get map(): L.Map {
    if (!this._map) { throw new Error('Map not initialized.'); }
    return this._map;
  }

  constructor(
    private readonly _eventService: EventService,
    private readonly _mapService: MapService,
    private readonly _storageService: StorageService,
    private readonly _router: Router,
    private readonly _zone: NgZone
  ) {
    this._subs.add(_eventService.menuFolded.subscribe(() => { this.invalidate(); }));
  }

  initialize(htmlElement: HTMLElement, options?: IMapInit): L.Map {
    if (this._map) { throw new Error('Map already initialized.'); }
    if (options?.fromQuery) { options = this.loadParamsFromQuery(); }
    this._map = this._mapService.createMap(htmlElement, options);
    return this._map;
  }

  isInitialized(): boolean {
    return !!this._map;
  }

  on(event: string, func: any): void {
    this.map.on(event, func);
  }

  enable(): void {
    const map = this.map;
    map.scrollWheelZoom.enable();
    map.doubleClickZoom.enable();
    map.boxZoom.enable();
    map.keyboard.enable();
    map.touchZoom.enable();
    map.dragging.enable();
  }

  disable(): void {
    const map = this.map;
    map.zoomControl?.remove();
    map.scrollWheelZoom.disable();
    map.doubleClickZoom.disable();
    map.boxZoom.disable();
    map.keyboard.disable();
    map.touchZoom.disable();
    map.dragging.disable();
  }

  // #region Map state

  invalidate(): void {
    this.map.invalidateSize();
  }

  loadParamsFromQuery(): IMapInit {
    const searchParams = new URL(location.href).searchParams;
    const x = +(searchParams.get('x') || 270);
    const y = +(searchParams.get('y') || -270);
    const z = +(searchParams.get('z') || 0);
    return {
      view: [y, x],
      zoom: z,
      zoomPanOptions: { animate: false, duration: 0 }
    };
  }

  saveParamsToQuery(): void {
    const url = new URL(location.href);
    const c = this._map?.getCenter();
    if (!c) { return; }
    url.searchParams.set('x', `${Math.floor(c.lng)}`);
    url.searchParams.set('y', `${Math.floor(c.lat)}`);
    url.searchParams.set('z', `${this._map!.getZoom()}`);
    window.history.replaceState(window.history.state, '', url.pathname + url.search);
  }

  saveParamsToQueryOnMove(): void {
    this.on('moveend', () => this.saveParamsToQuery());
  }

  // #endregion

  // #region Realms

  showRealm(realm: IRealm, options: { showBoundary?: boolean, showLabel?: boolean, onClick?: (evt: L.LeafletMouseEvent) => void }): L.LayerGroup {
    const map = this.map;
    const layer = L.layerGroup().addTo(map);

    const mapData = realm.mapData;
    if (!mapData) { return layer; }

    if (options.showBoundary && mapData.boundary) {
      // Add boundary
      const poly = L.polygon(mapData.boundary, { color: mapData.boundaryColor || '#ff8a00', weight: 1, fillOpacity: 0 });
      poly.addTo(layer);

      // Add click event.
      options.onClick && poly.addEventListener('click', evt => { options.onClick!(evt); });

      // Add label
      if (options.showLabel) {
        const className = `map-label-realm map-label-realm-${mapData.boundaryLabelAlign || 'center'}`;
        L.marker(mapData.boundary[0], {
          icon: L.divIcon({
            className,
            html: `<span>${realm.name}</span>`
          })
        }).addTo(layer);
      }
    }

    return layer;
  }

  showArea(area: IArea, options: { icon?: string, onClick?: (evt: L.LeafletMouseEvent) => void }): L.LayerGroup {
    return this.createArea(area, options).addTo(this.map);
  }

  createArea(area: IArea, options: { icon?: string, onClick?: (evt: L.LeafletMouseEvent) => void }): L.LayerGroup {
    const map = this.map;
    const layer = L.layerGroup();

    const icon = options.icon || 'location_on_orange';
    const iconPath =`assets/icons/symbols/${icon}.svg`;
    this._icons[icon] ??= L.icon({
      iconUrl: iconPath,
      iconSize: [24, 24],
      popupAnchor: [0, -12],
    });
    let areaIcon = this._icons[icon];

    const marker = L.marker(area.mapData!.position!, { icon: areaIcon });
    const spiritsHtml = `
<div class="container link s-leaflet-item" onclick="mapGotoAreaSpirits('${area.guid}')">
  <div class="ws-nw">${area.spirits?.length || 0} ${area.spirits?.length === 1 ? 'spirit' : 'spirits'}</div>
</div>`;
    const wlHtml = `
<div class="container link s-leaflet-item" onclick="mapGotoAreaWingedLights('${area.guid}')">
  <div class="ws-nw">${area.wingedLights?.length || 0} ${area.wingedLights?.length === 1 ? 'winged light' : 'winged lights'}</div>
</div>`;
    const content = `
<div class="s-leaflet-tooltip" data-area="${area.guid}">
  <div class="container link s-leaflet-item" onclick="mapGotoArea('${area.guid}')"><div class="menu-icon s-leaflet-maticon">location_on</div><div class="menu-label">${area.name || ''}</div></div>
  <div class="s-leaflet-grid mt-half">
  ${spiritsHtml}
  ${wlHtml}
  </div>
</div>
`;

    (window as any).mapGotoArea ??= (guid: string) => {
      this._zone.run(() => { this.gotoArea(guid); });
    };
    (window as any).mapGotoAreaSpirits ??= (guid: string) => {
      this._zone.run(() => { this._router.navigate(['/spirit'], { queryParams: { area: guid }}); });
    }
    (window as any).mapGotoAreaWingedLights ??= (guid: string) => {
      this._zone.run(() => { this._router.navigate(['/col'], { queryParams: { area: guid }}); });
    };

    const popup = new L.Popup({ content });
    marker.bindPopup(popup);
    layer.addLayer(marker);

    options.onClick && marker.addEventListener('click', evt => {

      if (false) {
        navigator.clipboard.writeText(`
        { "area": "${area.guid}" },`);
      }

      options.onClick!(evt);
      popup.openOn(map);
    });

    return layer;
  }

  createMapShrine(shrine: IMapShrine, options: {}): L.Marker {
    this._icons['map-shrine'] ??= L.icon({
      iconUrl: 'assets/icons/map-shrine.svg',
      iconSize: [24, 24],
      popupAnchor: [0, -12],
    });

    const marker = L.marker(shrine.mapData!.position!, {
      icon: this._icons['map-shrine'],
      opacity: this._storageService.hasMapMarker(shrine.guid) ? opacityFound : 1
    });

    const popup = new L.Popup({ content: _marker => {
      const div = this.ttFlex();
      div.appendChild(this.ttFind(shrine.guid, marker));
      div.appendChild(this.ttArea(shrine.area));

      if (shrine.imageUrl) {
        div.appendChild(this.ttImg(shrine.imageUrl));
      }

      return div;
    }});
    marker.bindPopup(popup);

    return marker;
  }

  // #endregion

  private gotoArea(areaGuid: string): void {
    this._router.navigate(['/area', areaGuid]);
  }

  private ttFlex(): HTMLElement {
    const div = document.createElement('div');
    div.classList.add('s-leaflet-tooltip', 's-leaflet-flex');
    return div;
  }

  private ttFind(guid: string, marker: L.Marker): HTMLElement {
    const div = document.createElement('div');
    div.classList.add('container', 'point', 's-leaflet-item');
    const divIcon = document.createElement('div');
    divIcon.classList.add('menu-icon', 's-leaflet-maticon');
    divIcon.innerText = this._storageService.hasMapMarker(guid) ? 'check_box' : 'check_box_outline_blank';
    div.appendChild(divIcon);
    div.insertAdjacentHTML('beforeend', `<div class="menu-label">Found</div>`);

    div.addEventListener('click', () => {
      const found = !this._storageService.hasMapMarker(guid);
      if (found) {
        this._storageService.addMapMarkers(guid);
        divIcon.innerText = 'check_box';
        marker.setOpacity(opacityFound);
      } else {
        this._storageService.removeMapMarkers(guid);
        divIcon.innerText = 'check_box_outline_blank';
        marker.setOpacity(1);
      }
    });

    return div;
  }

  private ttArea(area: IArea): HTMLElement {
    const div = document.createElement('div');
    div.classList.add('container', 'link', 's-leaflet-item');
    div.addEventListener('click', () => { this.gotoArea(area.guid); });
    div.insertAdjacentHTML('beforeend', `<div class="menu-icon s-leaflet-maticon">location_on</div><div class="menu-label">${area.name || ''}</div>`);
    return div;
  }

  private ttImg(imgUrl: string): HTMLElement {
    const img = document.createElement('img');
    img.src = imgUrl;
    img.width = 270;
    img.classList.add('s-leaflet-image', 'br');
    img.addEventListener('dblclick', () => {
      try {
        const url = new URL(img.src);
        url.searchParams.set('r', nanoid(10));
        window.open(url.href, '_blank');
      } catch { return; }
    });
    return img;
  }


  ngOnDestroy(): void {
    this._subs.unsubscribe();
    this._map?.off();
    this._map?.remove();
    this._map = undefined;
  }
}
