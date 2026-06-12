import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Button } from './Button';
import { Input } from './Input';
import { Select } from './Select';
import { MarkdownRender } from './MarkdownRender';
import { MarkdownEditor } from './MarkdownEditor';

describe('Button', () => {
  it('renders children', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button')).toHaveTextContent('Click me');
  });

  it('renders disabled state', () => {
    render(<Button disabled>Click</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('renders loading state', () => {
    render(<Button loading>Click</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
    expect(screen.getByText('Click')).toBeInTheDocument();
  });

  it('calls onClick', () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Click</Button>);
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalled();
  });
});

describe('Input', () => {
  it('renders label', () => {
    render(<Input label="Name" />);
    expect(screen.getByLabelText('Name')).toBeInTheDocument();
  });

  it('shows error text', () => {
    render(<Input label="Name" error="Required" />);
    expect(screen.getByText('Required')).toBeInTheDocument();
  });

  it('calls onChange', () => {
    const onChange = vi.fn();
    render(<Input label="Name" onChange={onChange} />);
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'test' } });
    expect(onChange).toHaveBeenCalled();
  });
});

describe('Select', () => {
  it('renders options', () => {
    render(
      <Select label="Choice">
        <option value="a">A</option>
        <option value="b">B</option>
      </Select>,
    );
    expect(screen.getByLabelText('Choice')).toBeInTheDocument();
    expect(screen.getByText('A')).toBeInTheDocument();
    expect(screen.getByText('B')).toBeInTheDocument();
  });
});

describe('MarkdownRender', () => {
  it('renders GFM lists', async () => {
    render(<MarkdownRender content={'- item one\n- item two'} />);
    expect(await screen.findByText('item one')).toBeInTheDocument();
    expect(await screen.findByText('item two')).toBeInTheDocument();
  });
});

describe('MarkdownEditor', () => {
  it('renders textarea', () => {
    render(<MarkdownEditor value="test" onChange={() => {}} />);
    expect(screen.getByRole('textbox')).toHaveValue('test');
  });

  it('calls onChange', () => {
    const onChange = vi.fn();
    render(<MarkdownEditor value="" onChange={onChange} />);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'new text' } });
    expect(onChange).toHaveBeenCalledWith('new text');
  });
});
