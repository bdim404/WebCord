/*
 * Cosmetic.ts – Website improvements for better integration within client
 */

import { wLog } from '../../global';

/**
 * Gets list of the elements with `tagName` tag name that has any class assigned
 * which its name includes the `searchString`. This tries to replicate the
 * similar behaviour as the one achieved by the `.getElementsByClassName`
 * method, except it can allow for part of the class names as an input.
 * 
 * This can be extremly usefull when trying to tweak the sites whose class names
 * includes some part being randomly generated for each build/version.
 */

function findClass<T extends keyof HTMLElementTagNameMap>(searchString: string, tagName: T) {
  const elementList: Array<HTMLElementTagNameMap[T]> = [];
  for (const container of document.getElementsByTagName<T>(tagName))
    if (container.classList.toString().includes(searchString))
      elementList.push(container);
  return elementList;
}

export default function preloadCosmetic(localStorage: Storage): void {
  localStorage.setItem('hideNag', 'true');
  const removeUnneded = () => {
    // If user is at login/register website, do not apply any cosmetic changes
    if (document.URL.includes('login') || document.URL.includes('register')) {
      window.addEventListener('popstate', removeUnneded, false);
      return;
    }
    // Get array of `div` elements
    const sideBarList = findClass('listItem-', 'div');

    if (sideBarList.length !== 0) {
      sideBarList[sideBarList.length - 1].remove(); // Remove "app download" button
      sideBarList[sideBarList.length - 2].remove(); // Remove separator
      wLog("Successfully removed unnecesarry elements on website.");
    } else {
      wLog("COSMETIC: Website hasn't been fully loaded yet, retrying after 0.5s...");
      setTimeout(removeUnneded, 500);
    }
  };
  window.addEventListener('load', removeUnneded);
}