import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'dietaryOptions'
})
export class DietaryOptionsPipe implements PipeTransform {
  transform(service: any): string {
    const options = [];
    if (service.vegetarian) options.push('Vegetarian');
    if (service.vegan) options.push('Vegan');
    if (service.keto) options.push('Keto');
    if (service.glutenFree) options.push('Gluten-Free');
    return options.join(', ');
  }
}
