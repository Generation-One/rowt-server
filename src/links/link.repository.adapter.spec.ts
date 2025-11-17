import { LinkRepositoryAdapter } from 'src/links/link.repository.adapter';

describe('LinkRepositoryAdapter.updateLink', () => {
  let adapter: LinkRepositoryAdapter;
  let mockLinkRepository: any;
  let mockProjectRepository: any;
  let mockUserRepository: any;

  beforeEach(() => {
    mockLinkRepository = {
      findOne: jest.fn(),
      update: jest.fn(),
    };
    mockProjectRepository = {};
    mockUserRepository = {};

    adapter = new LinkRepositoryAdapter(
      mockLinkRepository as any,
      mockProjectRepository as any,
      mockUserRepository as any,
    );
  });

  it('should include isParameterized when updating link', async () => {
    const existingLink = { id: 'nav-r', isParameterized: false } as any;
    const updatedLink = { id: 'nav-r', isParameterized: true } as any;

    mockLinkRepository.findOne
      .mockResolvedValueOnce(existingLink)
      .mockResolvedValueOnce(updatedLink);

    await adapter.updateLink('nav-r', { isParameterized: true } as any);

    expect(mockLinkRepository.update).toHaveBeenCalledWith('nav-r', {
      isParameterized: true,
    });
  });
});

