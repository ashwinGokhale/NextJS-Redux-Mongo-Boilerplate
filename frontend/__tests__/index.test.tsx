import React from 'react';
import { shallow } from 'enzyme';
import Index from '../pages';

describe('Index Page', () => {
	it('renders the a page with correct text', () => {
		const wrapper = shallow(<Index />);
		expect(wrapper).toBeTruthy();
	});
});
