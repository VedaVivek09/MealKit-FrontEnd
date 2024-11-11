import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'ingredientQualities'
})
export class IngredientQualitiesPipe implements PipeTransform {
  transform(service: any): string {
    const qualities = [];
    if (service.organic) qualities.push('Organic');
    if (service.local) qualities.push('Local');
    if (service.sustainable) qualities.push('Sustainable');
    return qualities.join(', ');
  }
}
