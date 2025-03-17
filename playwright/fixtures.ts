import type { Locator } from '@playwright/test';
import { expect } from '@playwright/test';
import path from 'path';
import type { Page } from '@playwright/test';

export class BasePage {
	page: Page;
	path: string;

	constructor(page: Page, path: string) {
		this.page = page;
		this.path = path;
	}

	async goto() {
		await this.page.goto(this.path);
	}
}

export class FileIndexPage extends BasePage {
	FILE = 'test.pdf';
	FOLDER = 'folder';

	get_inode(name: string): Locator {
		return this.page
			.locator('[data-testid=inode]', {
				has: this.page.locator(`text="${name}"`)
			})
			.and(
				this.page.locator('[data-testid=inode]', {
					has: this.page.locator('[data-testid=delete-inode]')
				})
			);
	}

	async get_href_for_inode(inode: Locator): Promise<string> {
		const href = await inode.getByTestId('inode-link').getAttribute('href');
		return href!;
	}

	async create_folder(name: string = this.FOLDER) {
		await this.page.getByTestId('show-folder-form').click();
		await this.page.getByTestId('folder-name-input').fill(name);
		await this.page.getByTestId('create-folder').click();
		return this.get_href_for_inode(this.get_inode(name));
	}

	async upload_file(name: string = this.FILE): Promise<string> {
		const file_path = path.join(__dirname, '..', 'test_data', name);
		await this.page.getByTestId('files-input').setInputFiles(file_path);
		return this.get_href_for_inode(this.get_inode(name));
	}

	async delete_inode(name: string) {
		const inode = this.get_inode(name);
		await inode.getByTestId('inode-actions-toggle').click();
		await inode.getByTestId('delete-inode').click();
	}

	async start_conversation() {
		await this.page.getByTestId('start-conversation').click();
	}

	async remove_all() {
		const inode_actions = this.page.getByTestId('inode-actions');

		while (true) {
			const count = await inode_actions.count();
			if (count == 0) {
				break;
			}

			const actions = inode_actions.first();
			await actions.getByTestId('inode-actions-toggle').click();
			await actions.getByTestId('delete-inode').click();
			await expect(inode_actions).toHaveCount(count - 1);
		}
	}
}

export class FileEditPage extends BasePage {
	async update_name(name: string) {
		await this.page.getByTestId('inode-name-input').fill(name);
		await this.page.getByTestId('update-inode').click();
	}

	async update_public_state(is_public: boolean) {
		await this.page.getByTestId('inode-is-public-input').setChecked(is_public);
		await this.page.getByTestId('update-inode').click();
	}
}

export class ConversationDetailPage extends BasePage {
	async prompt(query: string, amount: number | undefined = undefined) {
		await this.page.getByTestId('query-input').fill(query);
		if (amount) {
			await this.page.getByTestId('amount-input').fill(amount.toString());
		}
		await this.page.getByTestId('create-prompt').click();
	}
}
