import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'suggestionFilter'
})
export class SuggestionFilterPipe implements PipeTransform {
  transform(vocabulary: string[], spellCheckResults: string[]): string[] {
    return vocabulary.filter(word => 
      spellCheckResults.some(result => word.startsWith(result))
    );
  }
}
