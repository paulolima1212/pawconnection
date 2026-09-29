import { ILocalitySearch } from '../domain/ports/locality-search.port';
import { SearchLocalitiesUseCase } from './search-localities.use-case';

describe('SearchLocalitiesUseCase', () => {
  it('returns no suggestions until a city or neighborhood is typed', async () => {
    const search = jest.fn();
    const useCase = new SearchLocalitiesUseCase({ search } as ILocalitySearch);
    await expect(useCase.execute(' s ')).resolves.toEqual({ suggestions: [] });
    expect(search).not.toHaveBeenCalled();
  });

  it('formats neighborhood and city suggestions', async () => {
    const localities: ILocalitySearch = {
      search: () =>
        Promise.resolve([
          {
            mainText: 'Santa Catarina',
            secondaryText: 'São Gonçalo - RJ, Brasil',
          },
          { mainText: 'São Gonçalo', secondaryText: 'RJ, Brasil' },
        ]),
    };
    const useCase = new SearchLocalitiesUseCase(localities);
    await expect(useCase.execute('  santa  ')).resolves.toEqual({
      suggestions: [
        'Santa Catarina, São Gonçalo - RJ - Brasil',
        'São Gonçalo - RJ - Brasil',
      ],
    });
  });

  it('returns an empty list when the provider fails', async () => {
    const localities: ILocalitySearch = {
      search: () => Promise.reject(new Error('quota')),
    };
    const useCase = new SearchLocalitiesUseCase(localities);
    await expect(useCase.execute('Sydney')).resolves.toEqual({
      suggestions: [],
    });
  });
});
