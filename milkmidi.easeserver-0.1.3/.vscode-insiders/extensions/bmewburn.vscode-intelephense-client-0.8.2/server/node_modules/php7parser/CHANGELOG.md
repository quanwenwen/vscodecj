# Change Log

## [1.0.2] - 2017-11-01
#### Fixed
- Close tag on empty inline comment not being recognised 

## [1.0.1] - 2017-10-11
#### Fixed
- Endless loop on error inside namespace use decl when namespace keyword is alias
- Trailing whitespace missing from parse tree

## [1.0.0] - 2017-07-27
#### Changed
- Refactored lexer. No longer uses reg. exp.
- Up to 4x improved performance
- Removed interface declarations for each node type
- Parse errors now reported in tree as own nodes with skipped child tokens.
#### Fixed
- Single line comments should not consume trailing whitespace

## [0.9.9]- 2017-07-03
#### Fixed
- Missing unset cast in precedence table

## [0.9.8] - 2017-06-22
#### Fixed
- Whitespace inside on namespace use decl

## [0.9.7] - 2017-06-20
#### Fixed
- ArrayInitialiser allow empty element
- Floats with exponent
- Allow optional expr with break and continue

## [0.9.6] - 2017-06-20
#### Fixed
- Complex string syntax
- ConstantAccessExpression
- Errors not reported on ArrayInitialiserList

## [0.9.4] - 2017-04-23
#### Fixed
- Use group declaration missing }
- Close heredoc lexer bug 

## [0.9.3] - 2017-04-21
#### Fixed
- Use trait mangles parse tree

## [0.9.2] - 2017-04-21
#### Fixed
- Check for expect() null return.

## [0.9.1] - 2017-04-17
#### Fixed
- Wrong type used for class constant element.

## [0.9.0] - 2017-04-16
Initial release
